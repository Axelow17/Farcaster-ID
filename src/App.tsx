import React, { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { DashboardUser, RecentCast } from "./Types";
import { Dashboard } from "./components/Dashboard";
import * as htmlToImage from 'html-to-image';

const MINIAPP_URL =
  import.meta.env.VITE_MINIAPP_URL || "https://farcaster-dashboard-id-5rgh.vercel.app";
const MINT_URL =
  import.meta.env.VITE_MINT_URL || `${MINIAPP_URL}/mint`; // your mint page / dapp URL

const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;

const App: React.FC = () => {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [recentCasts, setRecentCasts] = useState<RecentCast[] | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const loadNeynarData = async (fid: number) => {
    if (!NEYNAR_API_KEY) {
      console.warn(
        "VITE_NEYNAR_API_KEY is not set – skipping Neynar integration."
      );
      return;
    }

    const headers: HeadersInit = {
      "x-api-key": NEYNAR_API_KEY,
      accept: "application/json"
    };

    // 1) User profile + stats
    const userUrl = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}&viewer_fid=${fid}`;
    const userRes = await fetch(userUrl, { headers });
    if (!userRes.ok) {
      console.warn("Failed to fetch Neynar user data", await userRes.text());
    } else {
      const data = await userRes.json();
      const u = data.users?.[0];
      if (u) {
        setUser((prev) => {
          const base = prev ?? {
            fid,
            username: u.username ?? `user-${fid}`,
            displayName: u.display_name ?? u.username ?? `FID ${fid}`
          };

          const locAddress = u.profile?.location?.address;
          const location =
            locAddress?.city && locAddress?.country
              ? `${locAddress.city}, ${locAddress.country}`
              : locAddress?.country || undefined;

          const primaryEth =
            u.verified_addresses?.primary?.eth_address ||
            u.verified_addresses?.eth_addresses?.[0] ||
            u.custody_address;

          return {
            ...base,
            avatarUrl: u.pfp_url ?? base.avatarUrl,
            followersCount: u.follower_count ?? base.followersCount,
            followingCount: u.following_count ?? base.followingCount,
            bio: u.profile?.bio?.text ?? base.bio,
            location: location ?? base.location,
            primaryAddress: primaryEth ?? base.primaryAddress,
            neynarScore:
              typeof u.experimental?.neynar_user_score === "number"
                ? u.experimental.neynar_user_score
                : base.neynarScore
          };
        });
      }
    }

    // 2) Recent casts
    const feedUrl = `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=fids&fids=${fid}&with_recasts=false&limit=5`;
    const feedRes = await fetch(feedUrl, { headers });
    if (!feedRes.ok) {
      console.warn("Failed to fetch Neynar feed", await feedRes.text());
    } else {
      const feed = await feedRes.json();
      const casts: RecentCast[] =
        feed.casts?.map((c: any) => ({
          hash: c.hash,
          text: c.text ?? "",
          timestamp: c.timestamp,
          likes: c.reactions?.likes_count ?? 0,
          recasts: c.reactions?.recasts_count ?? 0
        })) ?? [];
      setRecentCasts(casts);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        if (!inMiniApp) {
          setError(
            "Open this mini app from inside a Farcaster/Base client to see your dashboard."
          );
          setLoading(false);
          return;
        }

        const ctx = await sdk.context;
        const u = ctx.user;

        const baseUser: DashboardUser = {
          fid: u.fid,
          username: u.username ?? `user-${u.fid}`,
          displayName: u.displayName ?? u.username ?? `FID ${u.fid}`,
          avatarUrl: (u as any).pfpUrl
        };

        setUser(baseUser);

        await loadNeynarData(u.fid);

        await sdk.actions.ready();
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Failed to load data from Farcaster Mini App context.");
        setLoading(false);
      }
    };

    void init();
  }, []);

  const handleMint = async () => {
    try {
      await sdk.actions.openUrl(MINT_URL);
    } catch (e) {
      console.error("Failed to open mint page", e);
    }
  };

  const handleShare = async () => {
    try {
      const text =
        "I just checked my Farcaster ID card on Farcaster Dashboard ID 🪪✨. Try yours too!";
      await sdk.actions.composeCast({
        text,
        embeds: [MINIAPP_URL]
      });
    } catch (e) {
      console.error("Failed to open cast composer", e);
    }
  };

  const handleDownloadCard = () => {
    if (cardRef.current) {
      htmlToImage.toBlob(cardRef.current)
        .then((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'farcaster-card.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else {
            alert('Failed to generate image. Please try again.');
          }
        })
        .catch((error) => {
          console.error('Error generating image:', error);
          alert('Failed to download card. Please try again.');
        });
    }
  };

  if (loading) {
    return (
      <div className="fc-app-root">
        <div className="fc-app-shell">
          <div style={{ textAlign: "center", marginTop: 40, color: "#e5e7eb" }}>
            Loading your Farcaster data…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fc-app-root">
        <div className="fc-app-shell">
          <div style={{ textAlign: "center", marginTop: 40, color: "#e5e7eb" }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fc-app-root">
        <div className="fc-app-shell">
          <div style={{ textAlign: "center", marginTop: 40, color: "#e5e7eb" }}>
            No user data available.
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      ref={cardRef}
      user={user}
      recentCasts={recentCasts}
      onMint={handleMint}
      onShare={handleShare}
      onDownloadCard={handleDownloadCard}
    />
  );
};

export default App;
