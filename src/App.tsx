import React, { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { DashboardUser, RecentCast } from "./Types";
import { Dashboard } from "./components/Dashboard";
import * as htmlToImage from 'html-to-image';

const MINIAPP_URL =
  import.meta.env.VITE_MINIAPP_URL || "https://farcaster-dashboard-id-5rgh.vercel.app";

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
    const feedUrl = `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=fids&fids=${fid}&with_recasts=false&limit=100`;
    const feedRes = await fetch(feedUrl, { headers });
    if (!feedRes.ok) {
      console.warn("Failed to fetch Neynar feed", await feedRes.text());
    } else {
      const feed = await feedRes.json();
      const casts: RecentCast[] =
        feed.casts?.slice(0, 5).map((c: any) => ({
          hash: c.hash,
          text: c.text ?? "",
          timestamp: c.timestamp,
          likes: c.reactions?.likes_count ?? 0,
          recasts: c.reactions?.recasts_count ?? 0
        })) ?? [];
      setRecentCasts(casts);

      // Calculate castsCount and reactionsCount
      const allCasts = feed.casts ?? [];
      const totalReactions = allCasts.reduce((sum: number, c: any) => sum + (c.reactions?.likes_count ?? 0) + (c.reactions?.recasts_count ?? 0), 0);

      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, castsCount: allCasts.length, reactionsCount: totalReactions };
      });
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

  const handleShare = async () => {
    try {
      let embeds: string[] = [MINIAPP_URL];

      if (NEYNAR_API_KEY && cardRef.current) {
        // Generate image blob
        const blob = await htmlToImage.toBlob(cardRef.current);
        if (blob) {
          // Upload to Neynar
          const formData = new FormData();
          formData.append('file', blob, 'farcaster-card.png');

          const uploadRes = await fetch('https://api.neynar.com/v2/farcaster/media', {
            method: 'POST',
            headers: {
              'x-api-key': NEYNAR_API_KEY,
            },
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              embeds = user ? [uploadData.url, `https://warpcast.com/${user.username}`] : [uploadData.url, MINIAPP_URL];
            }
          } else {
            console.warn('Failed to upload image', await uploadRes.text());
          }
        }
      }

      const text = user ? 
        `🚀 Farcaster Dashboard Check! My Neynar Score: ${user.neynarScore?.toFixed(2) ?? 'N/A'} | ${user.followersCount ?? 0} followers | ${user.castsCount ?? 0} casts | @${user.username} | warpcast.com/${user.username}` :
        "I just checked my Farcaster ID card on Farcaster ID 🪪✨. Try yours too!";
      await sdk.actions.composeCast({
        text,
        embeds: embeds as any
      });
    } catch (e) {
      console.error("Failed to share", e);
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
      onShare={handleShare}
      onDownloadCard={handleDownloadCard}
    />
  );
};

export default App;
