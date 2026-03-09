import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Box,
  Building2,
  Laptop,
  Monitor,
  Cpu,
  HardDrive,
  Server,
  Database,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryDetail {
  inventoryID: number;
  name: string;
  available: number;
  moving: number;
  total: number;
}

interface ProductStats {
  total: number;
  available: number;
  moving: number;
  inventoryDetails: InventoryDetail[];
}

interface DashboardData {
  totalCompanies: number;
  totalInventory: number;
  totalItems: number;
  productStats: Record<string, ProductStats>;
  inventoryMap: Record<string, string>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/inventory/dashboard");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const productIcons: Record<string, any> = {
    laptop: Laptop,
    monitor: Monitor,
    ram: Cpu,
    system: Server,
    ssd: HardDrive,
    nvme: HardDrive,
    hdd: Database,
    graphicscard: Box,
    workstation: Server,
    mobileworkstation: Smartphone
  };

  const formatProductName = (key: string) => {
    const names: Record<string, string> = {
      laptop: "Laptops",
      monitor: "Monitors",
      ram: "RAM",
      system: "Systems",
      ssd: "SSD",
      nvme: "NVMe",
      hdd: "HDD",
      graphicscard: "Graphics Cards",
      workstation: "Workstations",
      mobileworkstation: "Mobile Workstations"
    };
    return names[key] || key;
  };


  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6">Failed to load dashboard.</div>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your inventory and companies.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <Box className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inventory Locations</p>
              <h3 className="text-2xl font-bold">{data.totalInventory}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900/20">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
              <h3 className="text-2xl font-bold">{data.totalCompanies}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-emerald-100 rounded-full dark:bg-emerald-900/20">
              <Box className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <h3 className="text-2xl font-bold">{data.totalItems}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-4">Product Overview</h2>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {Object.entries(data.productStats)?.map(([key, stats]) => {
          const Icon = productIcons[key] || Box;
          return (
            <Card key={key} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold capitalize">
                  {formatProductName(key)}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1 pt-0 overflow-hidden">
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[300px]">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 min-w-[100px] font-medium text-muted-foreground">Inventory</th>
                        <th className="py-1 font-medium text-muted-foreground text-center">Avail</th>
                        <th className="py-1 font-medium text-muted-foreground text-center">Mov</th>
                        <th className="py-1 font-medium text-muted-foreground text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.inventoryDetails?.map((inv) => (
                        <tr key={inv.inventoryID} className="border-b last:border-0">
                          <td className="py-1 font-medium">{inv.name}</td>
                          <td className="py-1 text-center text-green-600 font-semibold">{inv.available}</td>
                          <td className="py-1 text-center text-orange-600 font-semibold">{inv.moving}</td>
                          <td className="py-1 text-right font-bold">{inv.total}</td>
                        </tr>
                      ))}
                      {/* Grand Total Row */}
                      <tr className="border-t bg-muted/20">
                        <td className="py-1 font-bold pl-1">Total</td>
                        <td className="py-1 text-center font-bold text-green-700">{stats.available}</td>
                        <td className="py-1 text-center font-bold text-orange-700">{stats.moving}</td>
                        <td className="py-1 text-right font-bold pr-1">{stats.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
