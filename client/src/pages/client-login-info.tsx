import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Key, Phone, MapPin } from "lucide-react";

export default function ClientLoginInfo() {
  const clients = [
    {
      id: 2,
      username: "marie.raso",
      fullName: "Marie Rasoamalala",
      phone: "+261 34 12 345 67",
      address: "Lot II M 123, Ankazobe, Antananarivo",
      plan: "Plan Famille",
      price: "25000 MGA/mois"
    },
    {
      id: 3,
      username: "jean.rakoto",
      fullName: "Jean Rakotomalala",
      phone: "+261 33 98 765 43",
      address: "45 Avenue de l'Indépendance, Antananarivo",
      plan: "Plan Essentiel",
      price: "15000 MGA/mois"
    },
    {
      id: 4,
      username: "lova.razafy",
      fullName: "Lova Razafy",
      phone: "+261 32 44 55 66",
      address: "Rue Rainilaiarivony, Fianarantsoa",
      plan: "Plan Premium",
      price: "40000 MGA/mois"
    },
    {
      id: 5,
      username: "naina.andro",
      fullName: "Naina Andrianavalona",
      phone: "+261 34 77 88 99",
      address: "Lot VA 42, Antsirabe",
      plan: "Plan Famille",
      price: "25000 MGA/mois"
    },
    {
      id: 6,
      username: "hery.rabe",
      fullName: "Hery Rabemananjara",
      phone: "+261 33 11 22 33",
      address: "Cité 67 Ha, Toamasina",
      plan: "Plan Entreprise",
      price: "60000 MGA/mois"
    },
    {
      id: 7,
      username: "miora.rako",
      fullName: "Miora Rakotoarisoa",
      phone: "+261 32 55 66 77",
      address: "Quartier Analakely, Antananarivo",
      plan: "Plan Essentiel",
      price: "15000 MGA/mois"
    },
    {
      id: 8,
      username: "tahina.randra",
      fullName: "Tahina Randriamampionona",
      phone: "+261 34 88 99 00",
      address: "Avenue Rainilaiarivony, Mahajanga",
      plan: "Plan Premium",
      price: "40000 MGA/mois"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SV Pressing</h1>
          <p className="text-xl text-gray-600 mb-4">Service de Pressing Intelligent par Abonnement</p>
          <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              Identifiants Clients
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">Tous les clients utilisent le même mot de passe : <code className="bg-blue-100 px-2 py-1 rounded">password123</code></p>
            </div>
            <p className="text-gray-600">Chaque client a ses propres identifiants et accède uniquement à ses factures et contrats personnalisés.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  {client.fullName}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                    <Key className="w-4 h-4" />
                    {client.username}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{client.address}</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="mb-2">
                    {client.plan}
                  </Badge>
                  <p className="text-sm font-medium text-green-600">{client.price}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Fonctionnalités Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✓ Authentification Individuelle</h4>
                <p className="text-green-700">Chaque client a ses propres identifiants de connexion</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">✓ Factures Personnalisées</h4>
                <p className="text-blue-700">Accès uniquement aux factures du client connecté</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">✓ Contrats Individuels</h4>
                <p className="text-purple-700">Contrats d'abonnement personnalisés et téléchargeables</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}