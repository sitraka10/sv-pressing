import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { format } from "date-fns";
import { fr } from "date-fns/locale"; 

type Expense = {
  date: string;
  amount: number;
};

const groupExpensesByDay = (expenses: Expense[]) => {
  const map = new Map<string, number>();

  for (const expense of expenses) {
    const rawDate = new Date(expense.date);

    if (isNaN(rawDate.getTime())) {
      console.warn("❌ Date invalide ignorée :", expense.date);
      continue; // on ignore les dates invalides
    }

    const date = format(rawDate, "dd MMM", { locale: fr });

    map.set(date, (map.get(date) || 0) + (expense.amount || 0));
  }

  return Array.from(map.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));
};

const ExpensesLineChart = ({ expenses }: { expenses: Expense[] }) => {
  if (!expenses || expenses.length === 0) {
    return <p className="text-center text-muted-foreground">Aucune donnée à afficher</p>;
  }

  const data = groupExpensesByDay(expenses);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => `${value.toLocaleString()} Ar`} />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString()} Ar`, "Montant"]}
          labelStyle={{ fontWeight: "bold" }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#16a34a"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ExpensesLineChart;
