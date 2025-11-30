import React, { useEffect, useState, forwardRef } from "react";
import { DashboardUser, RecentCast } from "../types";
import QRCode from 'qrcode';

type DashboardProps = {
  user: DashboardUser;
  recentCasts?: RecentCast[];
  onShare?: () => void;
  onDownloadCard?: () => void;
  onRefreshData?: () => void;
  sharing?: boolean;
};

const formatTimestamp = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric"
  });
};

const formatAddress = (address?: string) => {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const Dashboard = forwardRef<HTMLDivElement, DashboardProps>(({
  user,
  recentCasts,
  onShare,
  onDownloadCard,
  onRefreshData,
  sharing = false
}, ref) => {
  const hasRealActivity = recentCasts && recentCasts.length > 0;
  const isLoadingCasts = recentCasts === undefined; // undefined means still loading
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCardClicked, setIsCardClicked] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [clickedStat, setClickedStat] = useState<string | null>(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  useEffect(() => {
    if (user.username) {
      QRCode.toDataURL(`https://warpcast.com/${user.username}`)
        .then(url => setQrCodeUrl(url))
        .catch(err => setQrCodeUrl(''));
    }
  }, [user.username]);

  const handleCardClick = () => {
    setIsCardClicked(true);
    setTimeout(() => setIsCardClicked(false), 300);
  };

  const handleFieldHover = (fieldName: string) => {
    setHoveredField(fieldName);
  };

  const handleFieldLeave = () => {
    setHoveredField(null);
  };

  const handleStatHover = (statName: string) => {
    setHoveredStat(statName);
  };

  const handleStatLeave = () => {
    setHoveredStat(null);
  };

  const handleStatClick = (statName: string) => {
    setClickedStat(statName);
    setTimeout(() => setClickedStat(null), 200);

    // Add floating emoji effect
    const emojis = ['✨', '⭐', '🌟', '💫', '🎉'];
    const newElement = {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    };
    setFloatingElements(prev => [...prev, newElement]);
    setTimeout(() => {
      setFloatingElements(prev => prev.filter(el => el.id !== newElement.id));
    }, 2000);
  };

  const handleHeaderHover = () => {
    setIsHeaderHovered(true);
  };

  const handleHeaderLeave = () => {
    setIsHeaderHovered(false);
  };

  return (
    <div ref={ref} className="fc-app-root">
      {/* Background decorative elements */}
      <div className="fc-bg-decoration fc-bg-decoration-1">🌟</div>
      <div className="fc-bg-decoration fc-bg-decoration-2">✨</div>
      <div className="fc-bg-decoration fc-bg-decoration-3">💫</div>
      <div className="fc-bg-decoration fc-bg-decoration-4">⭐</div>

      {/* Floating elements from stat clicks */}
      {floatingElements.map(element => (
        <div
          key={element.id}
          className="fc-floating-element"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
          }}
        >
          {element.emoji}
        </div>
      ))}

      <div className="fc-app-shell">
        {/* HEADER */}
        <header
          className={`fc-header ${isHeaderHovered ? 'fc-header-hovered' : ''}`}
          onMouseEnter={handleHeaderHover}
          onMouseLeave={handleHeaderLeave}
        >
          {/* Floating decorative elements */}
          <div className="fc-header-decoration fc-header-decoration-1">✨</div>
          <div className="fc-header-decoration fc-header-decoration-2">🌟</div>
          <div className="fc-header-decoration fc-header-decoration-3">💫</div>

          <div className="fc-header-left">
            <div className="fc-avatar-wrap">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="fc-avatar-img"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="fc-avatar-placeholder">
                  {user.displayName?.[0]?.toUpperCase() ?? "F"}
                </div>
              )}
              <span className="fc-status-dot" />
              {/* Avatar glow effect */}
              <div className="fc-avatar-glow"></div>
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
          <div
            className={`fc-stat-card ${hoveredStat === 'followers' ? 'fc-stat-hovered' : ''} ${clickedStat === 'followers' ? 'fc-stat-clicked' : ''}`}
            onMouseEnter={() => handleStatHover('followers')}
            onMouseLeave={handleStatLeave}
            onClick={() => handleStatClick('followers')}
          >
            <span className="fc-stat-label">Followers</span>
            <span className="fc-stat-value">
              {user.followersCount ?? "—"}
            </span>
            <div className="fc-stat-decoration">👥</div>
          </div>
          <div
            className={`fc-stat-card ${hoveredStat === 'following' ? 'fc-stat-hovered' : ''} ${clickedStat === 'following' ? 'fc-stat-clicked' : ''}`}
            onMouseEnter={() => handleStatHover('following')}
            onMouseLeave={handleStatLeave}
            onClick={() => handleStatClick('following')}
          >
            <span className="fc-stat-label">Following</span>
            <span className="fc-stat-value">
              {user.followingCount ?? "—"}
            </span>
            <div className="fc-stat-decoration">👤</div>
          </div>
          <div
            className={`fc-stat-card ${hoveredStat === 'casts' ? 'fc-stat-hovered' : ''} ${clickedStat === 'casts' ? 'fc-stat-clicked' : ''}`}
            onMouseEnter={() => handleStatHover('casts')}
            onMouseLeave={handleStatLeave}
            onClick={() => handleStatClick('casts')}
          >
            <span className="fc-stat-label">Casts</span>
            <span className="fc-stat-value">{user.castsCount ?? "—"}</span>
            <div className="fc-stat-decoration">💬</div>
          </div>
          <div
            className={`fc-stat-card ${hoveredStat === 'reactions' ? 'fc-stat-hovered' : ''} ${clickedStat === 'reactions' ? 'fc-stat-clicked' : ''}`}
            onMouseEnter={() => handleStatHover('reactions')}
            onMouseLeave={handleStatLeave}
            onClick={() => handleStatClick('reactions')}
          >
            <span className="fc-stat-label">Reactions</span>
            <span className="fc-stat-value">
              {user.reactionsCount ?? "—"}
            </span>
            <div className="fc-stat-decoration">❤️</div>
          </div>
        </section>

        {/* FARCASTER ID CARD */}
        <section className="fc-section">
          <div className="fc-section-header fc-section-interactive">
            <div className="fc-section-header-decoration">🪪</div>
            <div>
              <div className="fc-section-title">Farcaster Identity Card</div>
              <div className="fc-section-subtitle">
                Your personalized Farcaster identity card.
              </div>
            </div>
            <div className="fc-section-sparkle">✨</div>
          </div>

          <div className="fc-idcard-wrap">
            <div
              className={`fc-idcard ${isCardClicked ? 'fc-card-clicked' : ''}`}
              onClick={handleCardClick}
            >
              {/* Enhanced Border Glow */}
              <div className="fc-idcard-glow"></div>

              {/* Interactive Ornaments */}
              <div className="fc-idcard-interactive-ornament"></div>
              <div className="fc-idcard-interactive-ornament"></div>
              <div className="fc-idcard-interactive-ornament"></div>
              <div className="fc-idcard-interactive-ornament"></div>
              <div className="fc-idcard-interactive-ornament"></div>
              <div className="fc-idcard-interactive-ornament"></div>

              {/* Corner Ornaments */}
              <div className="fc-idcard-corner-tl"></div>
              <div className="fc-idcard-corner-tr"></div>
              <div className="fc-idcard-corner-bl"></div>
              <div className="fc-idcard-corner-br"></div>

              {/* Animated Particles */}
              <div className="fc-particle fc-particle-1"></div>
              <div className="fc-particle fc-particle-2"></div>
              <div className="fc-particle fc-particle-3"></div>
              <div className="fc-particle fc-particle-4"></div>
              <div className="fc-particle fc-particle-5"></div>
              <div className="fc-particle fc-particle-6"></div>

              <div className="fc-idcard-strip" />

              {/* Top Right Logo */}
              <div className="fc-idcard-top-right-logo">
                <img src="/right.png" alt="Logo" className="fc-logo-img" crossOrigin="anonymous" />
              </div>

              <div className="fc-idcard-header">
                <div className="fc-idcard-logo">
                  <img src="/icon.png" alt="Farcaster ID" className="fc-idcard-logo-icon" crossOrigin="anonymous" />
                </div>
                <div>
                  <div className="fc-idcard-title">
                    FARCASTER IDENTITY CARD
                  </div>
                  <div className="fc-idcard-subtitle">
                    Network: Base · Protocol: Farcaster
                  </div>
                  <div className="fc-status-indicator">
                    <span className="fc-status-dot"></span>
                    Active on Farcaster
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
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="fc-idcard-photo-placeholder">
                        {user.displayName?.[0]?.toUpperCase() ?? "F"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fc-idcard-info-col">
                  <div className="fc-idcard-field fc-field-primary">
                    <span className="fc-idcard-label">👤 Name</span>
                    <span className="fc-idcard-value fc-value-primary">
                      {user.displayName || "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field">
                    <span className="fc-idcard-label">📱 Username</span>
                    <span className="fc-idcard-value">
                      @{user.username || "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field fc-field-technical">
                    <span className="fc-idcard-label">🆔 FID</span>
                    <span className="fc-idcard-value">
                      #{user.fid ?? "—"}
                    </span>
                  </div>

                  <div className="fc-idcard-field fc-field-technical">
                    <span className="fc-idcard-label">⭐ Neynar Score</span>
                    <div className="fc-idcard-value">
                      {user.neynarScore ? (
                        <div className="fc-score-with-badge">
                          <span className="fc-score-badge">
                            {user.neynarScore.toFixed(2)}
                          </span>
                          <img
                            src="/farcaster-logo.png"
                            alt="Neynar"
                            className="fc-score-logo"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                <div className="fc-idcard-qr-col">
                  <div className="fc-idcard-qr">
                    <img src={qrCodeUrl} alt="QR Code" className="fc-qr-img" crossOrigin="anonymous" />
                  </div>
                  <span className="fc-idcard-qr-caption">
                    Scan on Farcaster
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="fc-section fc-section-last">
          <div className="fc-section-header fc-section-interactive">
            <div className="fc-section-header-decoration">📊</div>
            <div>
              <div className="fc-section-title">Recent Activity</div>
              <div className="fc-section-subtitle">
                Latest casts from your Farcaster account with real likes & recasts.
              </div>
            </div>
            <div className="fc-section-sparkle">🚀</div>
            {onRefreshData && (
              <button
                className="fc-refresh-btn"
                onClick={onRefreshData}
                title="Refresh real data"
              >
                🔄
              </button>
            )}
          </div>

          <div className="fc-activity-list">
            {isLoadingCasts ? (
              <div className="fc-activity-item">
                <div className="fc-activity-dot" />
                <div className="fc-activity-main">
                  <div className="fc-activity-text">
                    Loading your recent casts...
                  </div>
                  <div className="fc-activity-meta">
                    Please wait
                  </div>
                </div>
              </div>
            ) : hasRealActivity ? (
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
                      No recent casts found. Start casting on Farcaster to see your activity here! 🚀
                    </div>
                    <div className="fc-activity-meta">
                      Your casts will appear here
                    </div>
                  </div>
                </div>
                <div className="fc-activity-item">
                  <div className="fc-activity-dot" />
                  <div className="fc-activity-main">
                    <div className="fc-activity-text">
                      "Sample: Just discovered this awesome Farcaster dashboard mini app! 🪪✨"
                    </div>
                    <div className="fc-activity-meta">
                      Sample · 42 likes · 8 recasts
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <section className="fc-section fc-section-last">
          <div className="fc-actions">
            <div className="fc-actions-decoration fc-actions-decoration-left">🎯</div>
            <button
              className="fc-btn fc-btn-secondary"
              type="button"
              onClick={onShare}
              disabled={sharing}
            >
              <span className="fc-btn-icon">{sharing ? "⏳" : "📣"}</span>
              <span>{sharing ? "Sharing..." : "Share ID to Farcaster"}</span>
            </button>

            <button
              className="fc-btn fc-btn-ghost"
              type="button"
              onClick={onDownloadCard}
            >
              <span className="fc-btn-icon">⬇️</span>
              <span>Download Card</span>
            </button>
            <div className="fc-actions-decoration fc-actions-decoration-right">💫</div>
          </div>
        </section>
      </div>
    </div>
  );
});
