import React, {
  lazy,
  Suspense,
} from "react";

import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import MainLayout from "./layout/MainLayout.jsx";

/*
 * Keep Login in the initial bundle because it is the first page
 * required by signed-out users.
 */
import Login from "./pages/Login.jsx";

/*
 * Protected pages are loaded only when their routes are opened.
 */
const Dashboard = lazy(() =>
  import("./pages/Dashboard.jsx")
);

const UserManagement = lazy(() =>
  import("./pages/UserManagement.jsx")
);

const MasterCattle = lazy(() =>
  import("./pages/MasterCattle.jsx")
);

const CattleRegistration = lazy(() =>
  import("./pages/CattleRegistration.jsx")
);

const NewTag = lazy(() =>
  import("./pages/NewTag.jsx")
);

const MilkYield = lazy(() =>
  import("./pages/MilkYield.jsx")
);

const BioWaste = lazy(() =>
  import("./pages/BioWaste.jsx")
);

const SamvardhanaOutgoing = lazy(() =>
  import(
    "./pages/SamvardhanaOutgoing.jsx"
  )
);

const Vaccine = lazy(() =>
  import("./pages/Vaccine.jsx")
);

const Treatment = lazy(() =>
  import("./pages/Treatment.jsx")
);

const NewBorn = lazy(() =>
  import("./pages/NewBorn.jsx")
);

const Feeding = lazy(() =>
  import("./pages/Feeding.jsx")
);

const DattuYojana = lazy(() =>
  import("./pages/DattuYojana.jsx")
);

const Deregister = lazy(() =>
  import("./pages/Deregister.jsx")
);

const DeathRecords = lazy(() =>
  import("./pages/DeathRecords.jsx")
);

const Reports = lazy(() =>
  import("./pages/Reports.jsx")
);

const PedigreeViewer = lazy(() =>
  import("./pages/PedigreeViewer.jsx")
);

/*
 * Master-configuration pages.
 */
const Breeds = lazy(() =>
  import("./pages/config/Breeds")
);

const Medicines = lazy(() =>
  import("./pages/config/Medicines")
);

const Rates = lazy(() =>
  import("./pages/config/Rates")
);

const Weight = lazy(() =>
  import("./pages/config/Weight")
);

const Symptoms = lazy(() =>
  import("./pages/config/Symptoms")
);

const ShedConfig = lazy(() =>
  import("./pages/config/ShedConfig")
);

const PreventiveCareMaster = lazy(() =>
  import(
    "./pages/config/PreventiveCareMaster"
  )
);

/**
 * Displayed inside MainLayout while a route-level chunk loads.
 */
function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "240px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        color: "#64748b",
        fontSize: "0.95rem",
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      Loading page...
    </div>
  );
}

/**
 * Keeps the application shell visible while a lazy page loads.
 */
function LazyRoute({ children }) {
  return (
    <Suspense
      fallback={
        <RouteLoadingFallback />
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Role-protected route wrapper.
 */
function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const { user, loading } =
    useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <RouteLoadingFallback />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        state={{ from: location }}
        replace
      />
    );
  }

  const userRole = user?.role
    ? String(user.role).trim()
    : "";

  const normalizedUserRole =
    userRole.toLowerCase();

  const hasPermission =
    allowedRoles
      ? allowedRoles.some(
          (role) =>
            String(role)
              .trim()
              .toLowerCase() ===
            normalizedUserRole
        )
      : true;

  if (
    allowedRoles &&
    !hasPermission
  ) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#b91c1c",
        }}
      >
        <h2>Access Denied</h2>

        <p>
          You do not have permission
          to view this page.
        </p>

        <p>
          Your Role:{" "}
          <strong>
            {userRole}
          </strong>
        </p>

        <p
          style={{
            fontSize: "0.8rem",
            color: "#666",
          }}
        >
          Required:{" "}
          {allowedRoles.join(", ")}
        </p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/*
         * Main protected layout.
         * Accessible by all authenticated roles.
         */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Super Admin",
                "User",
                "Viewer",
              ]}
            >
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <LazyRoute>
                <Dashboard />
              </LazyRoute>
            }
          />

          {/* Herd management */}
          <Route
            path="/cattle/master"
            element={
              <LazyRoute>
                <MasterCattle />
              </LazyRoute>
            }
          />

          <Route
            path="/cattle/register"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <CattleRegistration />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pedigree"
            element={
              <LazyRoute>
                <PedigreeViewer />
              </LazyRoute>
            }
          />

          <Route
            path="/newborn"
            element={
              <LazyRoute>
                <NewBorn />
              </LazyRoute>
            }
          />

          <Route
            path="/new-tag"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <NewTag />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/deregister"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Deregister />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Operations */}
          <Route
            path="/milk-yield"
            element={
              <LazyRoute>
                <MilkYield />
              </LazyRoute>
            }
          />

          <Route
            path="/feeding"
            element={
              <LazyRoute>
                <Feeding />
              </LazyRoute>
            }
          />

          <Route
            path="/bio-waste"
            element={
              <LazyRoute>
                <BioWaste />
              </LazyRoute>
            }
          />

          <Route
            path="/samvardhana-outgoing"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <SamvardhanaOutgoing />
                </LazyRoute>
              </ProtectedRoute>
            }
          />


          {/* Veterinary */}
          <Route
            path="/treatment"
            element={
              <LazyRoute>
                <Treatment />
              </LazyRoute>
            }
          />

          <Route
            path="/vaccine"
            element={
              <LazyRoute>
                <Vaccine />
              </LazyRoute>
            }
          />

          <Route
            path="/death-records"
            element={
              <LazyRoute>
                <DeathRecords />
              </LazyRoute>
            }
          />

          {/* Sponsorship */}
          <Route
            path="/dattu-yojana"
            element={
              <LazyRoute>
                <DattuYojana />
              </LazyRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <LazyRoute>
                <Reports />
              </LazyRoute>
            }
          />

          {/* Master configuration */}
          <Route
            path="/config/breeds"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Breeds />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/medicines"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Medicines />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/preventive-care"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <PreventiveCareMaster />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/rates"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Rates />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/weight"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Weight />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/symptoms"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <Symptoms />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/config/sheds"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <ShedConfig />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* User management */}
          <Route
            path="/users"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                ]}
              >
                <LazyRoute>
                  <UserManagement />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}