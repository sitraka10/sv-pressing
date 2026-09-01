import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Pickup {
  id: number;
  clientId: number;
  scheduledDate: string;
  status: string;
}

interface PickupData {
  clientId: string;
  scheduledDate: string;
  status: string;
  notes: string;
}

export default function ManualPickupScheduler() {
  const queryClient = useQueryClient();

  const { data: pickups = [] } = useQuery<Pickup[]>({
    queryKey: ["pickups"],
    queryFn: () => fetch("/api/pickups").then((res) => res.json()),
  });

  const mutation = useMutation({
    mutationFn: (pickup: PickupData) =>
      fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickup),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["pickups"],
      }),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Planifier un ramassage
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);

          mutation.mutate({
            clientId: String(formData.get("clientId") ?? ""),
            scheduledDate: String(formData.get("scheduledDate") ?? ""),
            status: "scheduled",
            notes: String(formData.get("notes") ?? ""),
          });

          form.reset();
        }}
        className="space-y-2"
      >
        <input
          name="clientId"
          type="number"
          placeholder="ID du client"
          required
        />

        <input
          name="scheduledDate"
          type="datetime-local"
          required
        />

        <textarea
          name="notes"
          placeholder="Remarques (optionnel)"
        />

        <button type="submit">
          Ajouter
        </button>
      </form>

      <div>
        <h3 className="text-lg font-medium">
          Ramassages planifiés
        </h3>

        <ul>
          {pickups.map((pickup) => (
            <li key={pickup.id}>
              Client {pickup.clientId} –{" "}
              {new Date(pickup.scheduledDate).toLocaleString()} –{" "}
              {pickup.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}