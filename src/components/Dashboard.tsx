import React, { useEffect, useState, forwardRef } from "react";
import { DashboardUser, RecentCast } from "../Types";
import QRCode from 'qrcode';

type DashboardProps = {
  user: DashboardUser;
  recentCasts?: RecentCast[];
  onMint?: () => void;
  onShare?: () => void;
  onDownloadCard?: () => void;
};

const shortenAddress = (addr?: string) => {
  if (!addr) return "Not connected";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};

const formatTimestamp = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric"
  });
};

export const Dashboard = forwardRef<HTMLDivElement, DashboardProps>(({
  user,
  recentCasts,
  onMint,
  onShare,
  onDownloadCard
}, ref) => {
  const hasRealActivity = recentCasts && recentCasts.length > 0;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (user.username) {
      QRCode.toDataURL(`https://warpcast.com/${user.username}`)
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [user.username]);

  return (
    <div ref={ref} className="fc-app-root">
      <div className="fc-app-shell">
        {/* HEADER */}
        <header className="fc-header">
          <div className="fc-header-left">
            <div className="fc-avatar-wrap">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="fc-avatar-img"
                />
              ) : (
                <div className="fc-avatar-placeholder">
                  {user.displayName?.[0]?.toUpperCase() ?? "F"}
                </div>
              )}
              <span className="fc-status-dot" />
            </div>
            <div>
              <div className="fc-header-name">{user.displayName}</div>
              <div className="fc-header-username">@{user.username}</div>
              {user.bio && (
                <div
                  className="fc-header-bio"
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                    maxWidth: 220
                  }}
                >
                  {user.bio}
                </div>
              )}
              <div className="fc-header-meta">
                <span className="fc-pill fc-pill-soft">
                  FID #{user.fid ?? "—"}
                </span>
                {user.location && (
                  <span className="fc-pill fc-pill-ghost">
                    📍 {user.location}
                  </span>
                )}
                {typeof user.neynarScore === "number" && (
                  <span className="fc-pill fc-pill-ghost">
                    ⭐ Neynar Score {user.neynarScore.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="fc-header-right">
            <span className="fc-status-pill">
              <span className="fc-status-dot-small" />
              Active
            </span>
          </div>
        </header>

        {/* STATS */}
        <section className="fc-stats-row">
          <div className="fc-stat-card">
            <span className="fc-stat-label">Followers</span>
            <span className="fc-stat-value">
              {user.followersCount ?? "—"}
            </span>
          </div>
          <div className="fc-stat-card">
            <span className="fc-stat-label">Following</span>
            <span className="fc-stat-value">
              {user.followingCount ?? "—"}
            </span>
          </div>
          <div className="fc-stat-card">
            <span className="fc-stat-label">Casts</span>
            <span className="fc-stat-value">{user.castsCount ?? "—"}</span>
          </div>
          <div className="fc-stat-card">
            <span className="fc-stat-label">Reactions</span>
            <span className="fc-stat-value">
              {user.reactionsCount ?? "—"}
            </span>
          </div>
        </section>

        {/* FARCASTER ID CARD */}
        <section className="fc-section">
          <div className="fc-section-header">
            <div>
              <div className="fc-section-title">Farcaster Identity Card</div>
              <div className="fc-section-subtitle">
                This ID card will be used as your NFT template when you mint.
              </div>
            </div>
            <span className="fc-tag fc-tag-primary">NFT Ready</span>
          </div>

          <div className="fc-idcard-wrap">
            <div className="fc-idcard">
              <div className="fc-idcard-strip" />

              <div className="fc-idcard-header">
                <div className="fc-idcard-logo">
                  <span className="fc-idcard-logo-icon">◆</span>
                </div>
                <div>
                  <div className="fc-idcard-title">
                    FARCASTER IDENTITY CARD
                  </div>
                  <div className="fc-idcard-subtitle">
                    Network: Base · Protocol: Farcaster
                  </div>
                </div>
              </div>

              <div className="fc-idcard-body">
                <div className="fc-idcard-photo-col">
                  <div className="fc-idcard-photo-frame">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="fc-idcard-photo-img"
                      />
                    ) : (
                      <div className="fc-idcard-photo-placeholder">
                        {user.displayName?.[0]?.toUpperCase() ?? "F"}
                      </div>
                    )}
                  </div>
                  <div className="fc-idcard-chip">
                    <div className="fc-chip-line" />
                    <div className="fc-chip-line fc-chip-line-short" />
                    <div className="fc-chip-line" />
                  </div>
                </div>

                <div className="fc-idcard-info-col">
                  <div className="fc-idcard-field">
                    <span className="fc-idcard-label">Name</span>
                    <span className="fc-idcard-value">
                      {user.displayName || "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field">
                    <span className="fc-idcard-label">Username</span>
                    <span className="fc-idcard-value">
                      @{user.username || "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field">
                    <span className="fc-idcard-label">FID</span>
                    <span className="fc-idcard-value">
                      #{user.fid ?? "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field">
                    <span className="fc-idcard-label">Primary Wallet</span>
                    <span className="fc-idcard-value">
                      {shortenAddress(user.primaryAddress)}
                    </span>
                  </div>
                </div>

                <div className="fc-idcard-qr-col">
                  <div className="fc-idcard-qr">
                    <img src={qrCodeUrl} alt="QR Code" className="fc-qr-img" />
                  </div>
                  <span className="fc-idcard-qr-caption">
                    Scan on Farcaster
                  </span>
                </div>
              </div>

              <div className="fc-idcard-footer">
                <span className="fc-idcard-footer-text">
                  Generated by Farcaster Dashboard Mini App
                </span>
                <span className="fc-idcard-footer-badge">v1 • NFT Template</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <section className="fc-section">
          <div className="fc-actions">
            <button
              className="fc-btn fc-btn-primary"
              type="button"
              onClick={onMint}
            >
              <span className="fc-btn-icon">🪪</span>
              <span>Mint ID as NFT</span>
            </button>

            <button
              className="fc-btn fc-btn-secondary"
              type="button"
              onClick={onShare}
            >
              <span className="fc-btn-icon">📣</span>
              <span>Share ID to Farcaster</span>
            </button>

            <button
              className="fc-btn fc-btn-ghost"
              type="button"
              onClick={onDownloadCard}
            >
              <span className="fc-btn-icon">⬇️</span>
              <span>Download Card</span>
            </button>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="fc-section fc-section-last">
          <div className="fc-section-header">
            <div>
              <div className="fc-section-title">Recent Activity</div>
              <div className="fc-section-subtitle">
                Latest casts from your Farcaster account.
              </div>
            </div>
          </div>

          <div className="fc-activity-list">
            {hasRealActivity ? (
              recentCasts!.map((cast) => (
                <div className="fc-activity-item" key={cast.hash}>
                  <div className="fc-activity-dot" />
                  <div className="fc-activity-main">
                    <div className="fc-activity-text">
                      {cast.text || "(no text)"}
                    </div>
                    <div className="fc-activity-meta">
                      {formatTimestamp(cast.timestamp)} · {cast.likes} likes ·{" "}
                      {cast.recasts} recasts
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="fc-activity-item">
                  <div className="fc-activity-dot" />
                  <div className="fc-activity-main">
                    <div className="fc-activity-text">
                      “Sample cast: testing my Farcaster Dashboard mini app
                      today 🚀”
                    </div>
                    <div className="fc-activity-meta">
                      2h · 34 likes · 5 recasts
                    </div>
                  </div>
                </div>
                <div className="fc-activity-item">
                  <div className="fc-activity-dot" />
                  <div className="fc-activity-main">
                    <div className="fc-activity-text">
                      “Sample cast: just updated my avatar and bio on Farcaster
                      ✨”
                    </div>
                    <div className="fc-activity-meta">
                      Yesterday · 12 likes · 1 recast
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
});
