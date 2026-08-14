import React, { useEffect, useState } from "react";
import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import rashtrotthanaLogo from "../assets/Logo.png";

// -----------------------------------------------------------------------------
// ICONS
// -----------------------------------------------------------------------------

const Icons = {
  dashboard: (
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  ),

  cow: (
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 9H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V15z" />
  ),

  milk: (
    <path d="M14.06 6.1L12 4 9.94 6.1 8.5 4.6l-1.4 1.4L12 10.9l4.9-4.9-1.4-1.4zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  ),

  health: (
    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4v4h4v4z" />
  ),

  admin: (
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  ),

  config: (
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  ),

  pedigree: (
    <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z" />
  ),

  logout: (
    <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
  ),
};

// -----------------------------------------------------------------------------
// BREAKPOINT
// Keep this aligned with the CSS mobile breakpoint.
// -----------------------------------------------------------------------------

const MOBILE_BREAKPOINT = 768;

export default function MainLayout() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Desktop:
   * Sidebar is visible by default and can be collapsed.
   *
   * Mobile:
   * Sidebar is closed by default and opens as a drawer.
   */
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth > MOBILE_BREAKPOINT
  );

  const [isMobileViewport, setIsMobileViewport] = useState(
  () => window.innerWidth <= MOBILE_BREAKPOINT
);

const [expandedGroupId, setExpandedGroupId] = useState("");

  // ---------------------------------------------------------------------------
  // VIEWPORT CHANGE HANDLING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;

      setIsMobileViewport(mobile);

      /*
       * When moving to desktop, show the sidebar.
       * When moving to mobile, close the drawer.
       */
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // CLOSE MOBILE DRAWER AFTER ROUTE CHANGE
  // ---------------------------------------------------------------------------

    useEffect(() => {
    if (!isMobileViewport) {
      return undefined;
    }

    /*
     * Defer the state update to the next animation frame.
     * This closes the mobile drawer after programmatic route
     * changes without synchronously setting state in an effect.
     */
    const frameId =
      window.requestAnimationFrame(
        () => {
          setIsSidebarOpen(false);
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [
    location.pathname,
    isMobileViewport,
  ]);

  // ---------------------------------------------------------------------------
  // PREVENT BACKGROUND SCROLL WHILE MOBILE DRAWER IS OPEN
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isMobileViewport && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileViewport, isSidebarOpen]);

  // ---------------------------------------------------------------------------
  // ESCAPE KEY CLOSES MOBILE DRAWER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        isMobileViewport &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileViewport, isSidebarOpen]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((currentValue) => !currentValue);
  };

  const closeMobileSidebar = () => {
    if (isMobileViewport) {
      setIsSidebarOpen(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE CHECKS
  // ---------------------------------------------------------------------------

  const isAdmin =
    user?.role === "Admin" ||
    user?.role === "Super Admin";

  const isViewer = user?.role === "Viewer";

  // ---------------------------------------------------------------------------
  // MENU CONFIGURATION
  // ---------------------------------------------------------------------------

  const menuGroups = [
  {
    id: "dashboard",
    title: "",
    collapsible: false,
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: Icons.dashboard,
      },
    ],
  },
  {
    id: "herd-management",
    title: "HERD MANAGEMENT",
    collapsible: true,
    items: [
      {
        name: "Master Cattle Data",
        path: "/cattle/master",
        icon: Icons.cow,
      },
      {
        name: "Cattle Registration",
        path: "/cattle/register",
        icon: Icons.cow,
        restricted: !isAdmin,
      },
      {
        name: "Pedigree Viewer",
        path: "/pedigree",
        icon: Icons.pedigree,
      },
      {
        name: "Calving Log",
        path: "/newborn",
        icon: Icons.cow,
      },
      {
        name: "Tag Management",
        path: "/new-tag",
        icon: Icons.cow,
        restricted: !isAdmin,
      },
      {
        name: "Herd Exit",
        path: "/deregister",
        icon: Icons.cow,
        restricted: !isAdmin,
      },
    ],
  },
  {
    id: "daily-operations",
    title: "DAILY OPERATIONS",
    collapsible: true,
    items: [
      {
        name: "Milk Production",
        path: "/milk-yield",
        icon: Icons.milk,
      },
      {
        name: "Nutrition",
        path: "/feeding",
        icon: Icons.milk,
      },
      {
        name: "Waste Mgmt",
        path: "/bio-waste",
        icon: Icons.milk,
      },
      {
        name: "Samvardhana Outgoing",
        path: "/samvardhana-outgoing",
        icon: Icons.milk,
        restricted: !isAdmin,
      },
    ],
  },
  {
    id: "veterinary",
    title: "VETERINARY",
    collapsible: true,
    items: [
      {
        name: "Clinical Records",
        path: "/treatment",
        icon: Icons.health,
      },
      {
        name: "Preventive Care",
        path: "/vaccine",
        icon: Icons.health,
      },
      {
        name: "Mortality Register",
        path: "/death-records",
        icon: Icons.health,
      },
    ],
  },
  {
    id: "sponsorship-finance",
    title: "SPONSORSHIP & FINANCE",
    collapsible: true,
    items: [
      {
        name: "Sponsorships",
        path: "/dattu-yojana",
        icon: Icons.admin,
        restricted: isViewer,
      },
    ],
  },
  {
    id: "reports-analytics",
    title: "REPORTS & ANALYTICS",
    collapsible: true,
    items: [
      {
        name: "Reports",
        path: "/reports",
        icon: Icons.admin,
      },
    ],
  },
  {
    id: "master-configuration",
    title: "MASTER CONFIGURATION",
    collapsible: true,
    items: [
      {
        name: "Breeds",
        path: "/config/breeds",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Medicines",
        path: "/config/medicines",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Preventive Care Master",
        path: "/config/preventive-care",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Rates",
        path: "/config/rates",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Weight Stds",
        path: "/config/weight",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Symptoms",
        path: "/config/symptoms",
        icon: Icons.config,
        restricted: !isAdmin,
      },
      {
        name: "Sheds",
        path: "/config/sheds",
        icon: Icons.config,
        restricted: !isAdmin,
      },
    ],
  },
  {
    id: "administration",
    title: "ADMINISTRATION",
    collapsible: true,
    items: [
      {
        name: "User Management",
        path: "/users",
        icon: Icons.admin,
        restricted: !isAdmin,
      },
    ],
  },
];

const visibleMenuGroups = menuGroups
  .map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.restricted
    ),
  }))
  .filter((group) => group.items.length > 0);

const activeGroupId =
  visibleMenuGroups.find((group) =>
    group.items.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(
          `${item.path}/`
        )
    )
  )?.id || "";

useEffect(() => {
  if (!activeGroupId) {
    return undefined;
  }

  const frameId =
    window.requestAnimationFrame(() => {
      setExpandedGroupId(
        activeGroupId
      );
    });

  return () => {
    window.cancelAnimationFrame(
      frameId
    );
  };
}, [activeGroupId]);

const toggleMenuGroup = (groupId) => {
  setExpandedGroupId(
    (currentGroupId) =>
      currentGroupId === groupId
        ? ""
        : groupId
  );
};

  const sidebarClassName = [
    "sidebar",
    isSidebarOpen ? "sidebar-open" : "sidebar-hidden",
  ].join(" ");

  return (
    <div className="app-shell">
      {/* ---------------------------------------------------------------------
          TOP BAR
      --------------------------------------------------------------------- */}

      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="topbar-menu-btn"
            onClick={toggleSidebar}
            aria-label={
              isSidebarOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isSidebarOpen}
            aria-controls="main-sidebar"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div className="topbar-brand">
            <span className="topbar-title">GOVARDHANA</span>

            <span className="topbar-subtitle">
              Cattle Data Management System
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-user-summary">
            <span className="topbar-user-name">
              {user?.name || "User"}
            </span>

            <span className="topbar-user-role">
              {user?.role || ""}
            </span>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          LAYOUT BODY
      --------------------------------------------------------------------- */}

      <div className="layout-body">
        {/* Mobile backdrop */}

        {isMobileViewport && isSidebarOpen && (
          <button
            type="button"
            className="mobile-backdrop"
            onClick={closeMobileSidebar}
            aria-label="Close navigation menu"
          />
        )}

        {/* -------------------------------------------------------------------
            SIDEBAR
        ------------------------------------------------------------------- */}

        <aside
          id="main-sidebar"
          className={sidebarClassName}
          aria-hidden={isMobileViewport && !isSidebarOpen}
        >
          {/* Branding */}

          <div className="sidebar-brand">
            <img
              src={rashtrotthanaLogo}
              alt="Rashtrotthana Parishat"
              className="sidebar-logo"
            />

            <h1 className="sidebar-brand-title">
              GOVARDHANA
            </h1>

            <p className="sidebar-brand-subtitle">
              Cattle Data Management
            </p>
          </div>

          {/* Navigation */}

          <nav aria-label="Primary navigation">
  {visibleMenuGroups.map((group) => {
    const isExpanded =
      !group.collapsible ||
      expandedGroupId === group.id;

    const containsActivePage =
      group.id === activeGroupId;

    const panelId =
      `sidebar-group-${group.id}`;

    return (
      <div
        key={group.id}
        className={[
          "sidebar-menu-group",
          containsActivePage
            ? "sidebar-menu-group-active"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {group.collapsible && (
          <button
            type="button"
            className={[
              "sidebar-group-toggle",
              isExpanded
                ? "sidebar-group-toggle-expanded"
                : "",
              containsActivePage
                ? "sidebar-group-toggle-active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              toggleMenuGroup(group.id)
            }
            aria-expanded={isExpanded}
            aria-controls={panelId}
          >
            <span className="sidebar-group-title">
              {group.title}
            </span>

            <span
              className="sidebar-group-chevron"
              aria-hidden="true"
            >
              ›
            </span>
          </button>
        )}

        <div
          id={panelId}
          className={[
            "sidebar-group-items",
            isExpanded
              ? "sidebar-group-items-expanded"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          hidden={!isExpanded}
        >
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (group.collapsible) {
                  setExpandedGroupId(
                    group.id
                  );
                }

                closeMobileSidebar();
              }}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                className="sidebar-menu-icon"
                aria-hidden="true"
              >
                {item.icon}
              </svg>

              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  })}
</nav>

          {/* User and logout */}

          <div className="sidebar-user-section">
            <div className="sidebar-user-details">
              <div className="sidebar-user-avatar">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="sidebar-user-text">
                <div className="sidebar-user-name">
                  {user?.name || "User"}
                </div>

                <div className="sidebar-user-role">
                  {user?.role || ""}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
              >
                {Icons.logout}
              </svg>

              <span>Logout</span>
            </button>
          </div>

          {/* Footer */}

          <div className="sidebar-footer">
            © 2026 Rashtrotthana Parishat
          </div>
        </aside>

        {/* -------------------------------------------------------------------
            MAIN PAGE CONTENT
        ------------------------------------------------------------------- */}

        <main className="main-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}