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
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, x: number, y: number, emoji: string}>>([]);
  const [cardBackground, setCardBackground] = useState<string>('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

  const backgroundOptions = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple gradient
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink gradient
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue gradient
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green gradient
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Orange gradient
    '#020617' // Dark background
  ];

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

  const changeCardBackground = () => {
    const currentIndex = backgroundOptions.indexOf(cardBackground);
    const nextIndex = (currentIndex + 1) % backgroundOptions.length;
    setCardBackground(backgroundOptions[nextIndex]);
  };

  // Get theme colors based on current background
  const getThemeColors = (bg: string) => {
    if (bg.includes('#667eea')) return { primary: '#667eea', secondary: '#764ba2', accent: '#9b7ce8' };
    if (bg.includes('#f093fb')) return { primary: '#f093fb', secondary: '#f5576c', accent: '#ff7eb3' };
    if (bg.includes('#4facfe')) return { primary: '#4facfe', secondary: '#00f2fe', accent: '#6fd4ff' };
    if (bg.includes('#43e97b')) return { primary: '#43e97b', secondary: '#38f9d7', accent: '#6ff7b3' };
    if (bg.includes('#fa709a')) return { primary: '#fa709a', secondary: '#fee140', accent: '#ffb366' };
    return { primary: '#6366f1', secondary: '#8b5cf6', accent: '#a78bfa' }; // Default purple
  };

  const themeColors = getThemeColors(cardBackground);

  return (
    <div ref={ref} className="fc-app-root" style={{ background: `radial-gradient(circle at 20% 50%, ${themeColors.primary}15 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${themeColors.secondary}10 0%, transparent 50%), radial-gradient(circle at 40% 80%, ${themeColors.accent}08 0%, transparent 50%)` }}>
      {/* Enhanced Background decorative elements */}
      <div className="fc-bg-decoration fc-bg-decoration-1" style={{ color: themeColors.primary, fontSize: '2rem', animation: 'float 6s ease-in-out infinite' }}>🌟</div>
      <div className="fc-bg-decoration fc-bg-decoration-2" style={{ color: themeColors.secondary, fontSize: '1.5rem', animation: 'float 8s ease-in-out infinite reverse' }}>✨</div>
      <div className="fc-bg-decoration fc-bg-decoration-3" style={{ color: themeColors.accent, fontSize: '2.5rem', animation: 'float 7s ease-in-out infinite' }}>💫</div>
      <div className="fc-bg-decoration fc-bg-decoration-4" style={{ color: themeColors.primary, fontSize: '1.8rem', animation: 'float 9s ease-in-out infinite reverse' }}>⭐</div>
      <div className="fc-bg-decoration fc-bg-decoration-5" style={{ color: themeColors.secondary, fontSize: '2.2rem', animation: 'float 5s ease-in-out infinite' }}>🎨</div>
      <div className="fc-bg-decoration fc-bg-decoration-6" style={{ color: themeColors.accent, fontSize: '1.6rem', animation: 'float 10s ease-in-out infinite reverse' }}>🌈</div>
      <div className="fc-bg-decoration fc-bg-decoration-7" style={{ color: themeColors.primary, fontSize: '2.8rem', animation: 'float 6.5s ease-in-out infinite' }}>✨</div>
      <div className="fc-bg-decoration fc-bg-decoration-8" style={{ color: themeColors.secondary, fontSize: '1.4rem', animation: 'float 8.5s ease-in-out infinite reverse' }}>💎</div>

      {/* Animated background orbs */}
      <div className="fc-bg-orb fc-bg-orb-1" style={{ background: `radial-gradient(circle, ${themeColors.primary}20, transparent)`, animation: 'orbFloat 12s ease-in-out infinite' }}></div>
      <div className="fc-bg-orb fc-bg-orb-2" style={{ background: `radial-gradient(circle, ${themeColors.secondary}15, transparent)`, animation: 'orbFloat 15s ease-in-out infinite reverse' }}></div>
      <div className="fc-bg-orb fc-bg-orb-3" style={{ background: `radial-gradient(circle, ${themeColors.accent}10, transparent)`, animation: 'orbFloat 18s ease-in-out infinite' }}></div>

      {/* Floating elements from stat clicks */}
      {floatingElements.map(element => (
        <div
          key={element.id}
          className="fc-floating-element"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            color: themeColors.primary,
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
              style={{ background: cardBackground }}
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
              onClick={changeCardBackground}
            >
              <span className="fc-btn-icon">🎨</span>
              <span>Change Background</span>
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
