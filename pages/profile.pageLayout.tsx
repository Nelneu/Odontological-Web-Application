import { SharedLayout } from "../components/SharedLayout";
import { DentistOrPatientRoute } from "../components/ProtectedRoute";

// This page is protected and accessible by dentists, patients, and admins.
export default [DentistOrPatientRoute, SharedLayout];