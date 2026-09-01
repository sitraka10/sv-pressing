// client/src/pages/delivery-dashboard.tsx
import React from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function DeliveryDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Espace Livreur
          </h1>
          <p className="text-gray-600">Bienvenue, {user?.fullName}</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Tableau de bord livreur en cours de développement.
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  );
}