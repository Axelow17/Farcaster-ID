import React, { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { DashboardUser, RecentCast } from "./types";
import { Dashboard } from "./components/Dashboard";
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import { v2 as cloudinary } from 'cloudinary';

const MINIAPP_URL =
  import.meta.env.VITE_MINIAPP_URL || "https://farcaster-id-one.vercel.app";

const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// PNG generation method - can be switched easily
type PngMethod = 'html2canvas' | 'html-to-image' | 'dom-to-image';
const PNG_METHOD: PngMethod = 'html2canvas' as PngMethod; // Change this to: 'html2canvas', 'html-to-image', or 'dom-to-image'

// Utility function to generate PNG blob from HTML element
const generatePngBlob = async (element: HTMLElement): Promise<Blob | null> => {
  try {
    switch (PNG_METHOD) {
      case 'html2canvas':
        const canvas = await html2canvas(element, {
          backgroundColor: '#020617',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
        });
        return new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/png', 1.0);
        });

      case 'html-to-image':
        return await htmlToImage.toBlob(element, {
          backgroundColor: '#020617',
          width: 424,
          height: 695,
        });

      case 'dom-to-image':
        return await domtoimage.toBlob(element, {
          bgcolor: '#020617',
          width: 424,
          height: 695,
          quality: 1.0,
        });

      default:
        console.warn(`Unknown PNG method: ${PNG_METHOD}, falling back to html2canvas`);
        const fallbackCanvas = await html2canvas(element, {
          backgroundColor: '#020617',
          width: 424,
          height: 695,
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
        });
        return new Promise((resolve) => {
          fallbackCanvas.toBlob(resolve, 'image/png', 1.0);
        });
    }
  } catch (error) {
    console.error(`Error generating PNG with ${PNG_METHOD}:`, error);
    return null;
  }
};

// Utility function to upload PNG blob to Cloudinary
const uploadToCloudinary = async (element: HTMLElement): Promise<string | null> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.warn('Cloudinary configuration missing');
    return null;
  }

  try {
    // Find the actual card element to capture
    const cardElement = element.querySelector('.fc-idcard') as HTMLElement;
    if (!cardElement) {
      console.warn('Card element not found');
      return null;
    }

    // Generate PNG blob
    const blob = await generatePngBlob(cardElement);
    if (!blob) return null;

    // Convert blob to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Remove data URL prefix
    const base64Image = base64Data.split(',')[1];

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${base64Image}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', `farcaster-id-card-share-${Date.now()}`);
    formData.append('folder', 'farcaster-cards');

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('Cloudinary upload success:', uploadData);
      return uploadData.secure_url;
    } else {
      const errorText = await uploadResponse.text();
      console.error('Cloudinary upload failed:', uploadResponse.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [recentCasts, setRecentCasts] = useState<RecentCast[] | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const loadNeynarData = async (fid: number, showLoading = false) => {
    if (showLoading) {
      setRecentCasts(undefined); // Reset to show loading state
    }
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
        console.log("Neynar user data:", u); // Debug log
        console.log("Registered at:", u.registered_at); // Debug log
        setUser((prev) => {
          const base = prev ?? {
            fid,
            username: u.username ?? `user-${fid}`,
            displayName: u.display_name ?? u.username ?? `FID ${fid}`,
            avatarUrl: undefined,
            followersCount: undefined,
            followingCount: undefined,
            bio: undefined,
            location: undefined,
            primaryAddress: undefined,
            neynarScore: undefined
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

    // 2) Recent casts - get user's own casts with reactions
    const castsUrl = `https://api.neynar.com/v2/farcaster/casts?fid=${fid}&limit=5&author_fid=${fid}`;
    const castsRes = await fetch(castsUrl, { headers });
    if (!castsRes.ok) {
      console.warn("Failed to fetch Neynar casts", await castsRes.text());
      // Set empty array so we don't show loading forever
      setRecentCasts([]);
    } else {
      const castsData = await castsRes.json();
      console.log("Casts API response:", castsData); // Debug log

      const casts: RecentCast[] =
        castsData.result?.casts?.map((c: any) => {
          // Handle different possible reaction data structures
          const likes = c.reactions?.likes_count ??
                       c.reactions?.likes ??
                       c.like_count ??
                       c.likes ??
                       0;
          const recasts = c.reactions?.recasts_count ??
                          c.reactions?.recasts ??
                          c.recast_count ??
                          c.recasts ??
                          0;

          return {
            hash: c.hash,
            text: c.text ?? "",
            timestamp: c.timestamp,
            likes: likes,
            recasts: recasts
          };
        }) ?? [];

      console.log("Processed casts with real reactions:", casts); // Debug log
      setRecentCasts(casts);

      // Calculate castsCount and reactionsCount from real data
      setUser((prev) => {
        if (!prev) return prev;
        const totalReactions = casts.reduce((sum, cast) => sum + (cast.likes || 0) + (cast.recasts || 0), 0);
        return {
          ...prev,
          castsCount: castsData.result?.total ?? prev.castsCount ?? casts.length,
          reactionsCount: totalReactions
        };
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // For development: bypass miniapp check and use mock data
        const inMiniApp = true; // await sdk.isInMiniApp();
        if (!inMiniApp) {
          setError(
            "Open this mini app from inside a Farcaster/Base client to see your dashboard."
          );
          setLoading(false);
          return;
        }

        // Mock context for development
        const ctx = {
          user: {
            fid: 12345,
            username: "testuser",
            displayName: "Test User",
            pfpUrl: "https://example.com/avatar.png"
          }
        };
        // const ctx = await sdk.context;
        const u = ctx.user;

        const baseUser: DashboardUser = {
          fid: u.fid,
          username: u.username ?? `user-${u.fid}`,
          displayName: u.displayName ?? u.username ?? `FID ${u.fid}`,
          avatarUrl: (u as any).pfpUrl
        };

        setUser(baseUser);

        await loadNeynarData(u.fid);

        // await sdk.actions.ready();
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Failed to load data from Farcaster Mini App context.");
        setLoading(false);
      }
    };

    void init();
  }, []);

  // Setup embed meta tag for sharing the card
  useEffect(() => {
    const setupEmbedMetaTag = async () => {
      if (!user || !cardRef.current || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return;

      try {
        // Generate card image for embed using Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(cardRef.current);

        if (cloudinaryUrl) {
          // Create embed metadata
          const embedData = {
            version: "1",
            imageUrl: cloudinaryUrl,
            button: {
              title: "Open Dashboard",
              action: {
                type: "launch_miniapp",
                url: MINIAPP_URL,
                name: "Farcaster Dashboard ID",
                splashImageUrl: `${MINIAPP_URL}/splash.png`,
                splashBackgroundColor: "#020617"
              }
            }
          };

          // Add meta tag to document head
          const metaTag = document.createElement('meta');
          metaTag.name = 'fc:miniapp';
          metaTag.content = JSON.stringify(embedData);
          document.head.appendChild(metaTag);

          // Also add backward compatibility
          const frameMetaTag = document.createElement('meta');
          frameMetaTag.name = 'fc:frame';
          frameMetaTag.content = JSON.stringify(embedData);
          document.head.appendChild(frameMetaTag);

          console.log('Embed meta tags set up with Cloudinary image:', cloudinaryUrl);
        } else {
          console.warn('Failed to generate/upload card image for embed');
        }
      } catch (error) {
        console.error('Error setting up embed:', error);
      }
    };

    // Wait for images to load before generating
    const timer = setTimeout(() => {
      setupEmbedMetaTag();
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, MINIAPP_URL]);

  const handleShare = async () => {
    if (sharing) return; // Prevent multiple simultaneous shares

    try {
      setSharing(true);
      let embeds: string[] = [MINIAPP_URL];
      let cardImageUrl: string | null = null;

      // Try to generate and upload card image for rich embed
      if (cardRef.current) {
        try {
          console.log('Generating card image for share...');
          const cloudinaryUrl = await uploadToCloudinary(cardRef.current);

          if (cloudinaryUrl) {
            cardImageUrl = cloudinaryUrl;
            embeds = user ? [cardImageUrl, MINIAPP_URL, `@${user.username}`] : [cardImageUrl, MINIAPP_URL];
            console.log('Card image uploaded to Cloudinary successfully:', cardImageUrl);
          } else {
            console.warn('Failed to upload card image to Cloudinary');
          }
        } catch (imageError) {
          console.error('Error generating/uploading card image:', imageError);
          // Continue with text-only share
        }
      }

      // Create share text
      const text = user ? (() => {
        const score = user.neynarScore?.toFixed(2) ?? 'N/A';
        const followers = user.followersCount ?? 0;
        const following = user.followingCount ?? 0;

        // Enhanced share text template
        let shareText = `🚀 Farcaster ID Check! check my digital identity card 🪪✨\n\n`;
        shareText += `📊 Stats: Neynar Score ${score} | FID #${user.fid}\n`;
        shareText += `👥 ${followers} followers | ${following} following\n`;
        shareText += `🏷️ @${user.username}`;

        // Add badges based on follower count and score
        const badges = [];
        if (followers >= 1000) badges.push('🌟 Influencer');
        else if (followers >= 100) badges.push('⭐ Rising Star');
        else if (followers >= 10) badges.push('✨ Active Member');

        if (parseFloat(score) >= 85) badges.push('🏆 Top Scorer');
        else if (parseFloat(score) >= 70) badges.push('🎯 High Achiever');

        if (badges.length > 0) {
          shareText += `\n🎖️ ${badges.join(' | ')}`;
        }

        // Add location if available
        if (user.location) {
          shareText += ` | 📍 ${user.location}`;
        }

        // Add bio if available (truncated)
        if (user.bio) {
          const truncatedBio = user.bio.length > 100 ? user.bio.substring(0, 97) + '...' : user.bio;
          shareText += `\n\n"${truncatedBio}"`;
        }

        shareText += `\n\nCheck out your own Farcaster ID card! 🪄 #Farcaster #Web3 #Identity`;

        return shareText;
      })() : "Check out this Farcaster ID Card generator! 🪪";      console.log('Composing cast with:', { text, embeds });

      // Compose the cast
      await sdk.actions.composeCast({
        text,
        embeds: embeds as any
      });

      console.log('Cast shared successfully!');
      alert('Cast shared successfully! 🎉');

    } catch (e) {
      console.error('Failed to share cast:', e);
      alert('Failed to share cast. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleRefreshData = async () => {
    if (!user) return;
    await loadNeynarData(user.fid, true);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) {
      alert('Card not ready. Please try again.');
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary configuration missing. Please check environment variables.');
      return;
    }

    try {
      // Use the unified PNG generation function
      const blob = await generatePngBlob(cardRef.current);

      if (blob) {
        // Convert blob to base64 for Cloudinary upload
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Remove the data URL prefix to get just the base64 data
        const base64Image = base64Data.split(',')[1];

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', `data:image/png;base64,${base64Image}`);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('public_id', `farcaster-id-card-${user?.username || 'user'}-${Date.now()}`);
        formData.append('folder', 'farcaster-cards');

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          const cloudinaryUrl = uploadData.secure_url;

          // Copy URL to clipboard
          await navigator.clipboard.writeText(cloudinaryUrl);

          alert(`✅ Card uploaded to Cloudinary!\n📋 URL copied to clipboard:\n${cloudinaryUrl}`);
          console.log('Cloudinary upload successful:', cloudinaryUrl);
        } else {
          const errorData = await uploadResponse.text();
          console.error('Cloudinary upload failed:', errorData);
          alert('Failed to upload card to Cloudinary. Please try again.');
        }
      } else {
        alert('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      alert('Failed to upload card. Please check console for details.');
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
      onRefreshData={handleRefreshData}
      sharing={sharing}
    />
  );
};

export default App;
