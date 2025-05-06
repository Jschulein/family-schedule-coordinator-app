
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Family } from "@/types/familyTypes";

interface FamilyListProps {
  families: Family[];
  activeFamilyId: string | null;
  onSelectFamily: (id: string) => void;
}

export const FamilyList = ({ families, activeFamilyId, onSelectFamily }: FamilyListProps) => {
  if (!families || families.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            You haven't created or joined any families yet.
            Create your first family above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Families</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {families.map((fam) => (
          <Card
            key={fam.id}
            className={`flex items-center justify-between p-4 ${
              fam.id === activeFamilyId ? "border-primary" : ""
            }`}
          >
            <span className="text-lg font-medium">{fam.name}</span>
            <Button
              variant={fam.id === activeFamilyId ? "default" : "outline"}
              onClick={() => onSelectFamily(fam.id)}
            >
              {fam.id === activeFamilyId ? "Active" : "Set Active"}
            </Button>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
