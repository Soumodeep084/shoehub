"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDeliveryAgents, assignDeliveryAgent, overrideDeliveryStatus } from "@/lib/adminActions/order-actions";
import { StatusBadge } from "../status-badge";
import { Truck, ShieldAlert, User, Mail } from "lucide-react";
import Link from "next/link";

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string | null;
}

interface DeliveryAssignProps {
  orderId: string;
  orderStatus: string;
  deliveryStatus: string | null;
  assignedAgent: Agent | null;
  isAdmin: boolean;
}

export function DeliveryAssign({
  orderId,
  orderStatus,
  deliveryStatus,
  assignedAgent,
  isAdmin,
}: DeliveryAssignProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      setLoadingAgents(true);
      try {
        const res = await getDeliveryAgents();
        if (res.success && res.agents) {
          setAgents(res.agents);
        } else {
          console.error("Failed to load delivery agents:", res.error);
        }
      } catch (err) {
        console.error("Error loading delivery agents:", err);
      } finally {
        setLoadingAgents(false);
      }
    }

    if (["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) {
      loadAgents();
    }
  }, [orderStatus]);

  // If order is not packed yet, assignment is disabled
  const canAssign = ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus);

  if (!canAssign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            Delivery Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Delivery assignment becomes available once the order is packed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAssign = () => {
    if (!selectedAgentId) {
      toast.error("Please select a delivery agent");
      return;
    }

    startTransition(async () => {
      try {
        const res = await assignDeliveryAgent(orderId, selectedAgentId);
        if (res.success) {
          toast.success("Delivery agent assigned successfully");
          setSelectedAgentId("");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to assign delivery agent");
        }
      } catch {
        toast.error("An error occurred during assignment");
      }
    });
  };

  const handleOverride = () => {
    if (!overrideStatus) {
      toast.error("Please select an override status");
      return;
    }
    if (!overrideReason.trim()) {
      toast.error("Please provide an audit reason for the override");
      return;
    }

    startTransition(async () => {
      try {
        const res = await overrideDeliveryStatus(orderId, overrideStatus as "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED", overrideReason);
        if (res.success) {
          toast.success("Delivery status overridden successfully");
          setOverrideStatus("");
          setOverrideReason("");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to override delivery status");
        }
      } catch {
        toast.error("An error occurred during override");
      }
    });
  };

  // Reassignment lock condition: Reassignment is allowed only while delivery status is ASSIGNED
  const isReassignmentLocked = deliveryStatus && deliveryStatus !== "ASSIGNED";

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-zinc-700" />
            Delivery Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignedAgent ? (
            <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">
                    {assignedAgent.firstName} {assignedAgent.lastName}
                  </span>
                </div>
                <StatusBadge type="role" value="Delivery Agent" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{assignedAgent.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t text-xs">
                <span className="text-muted-foreground">Delivery Status</span>
                <span className="font-semibold text-foreground">
                  {deliveryStatus}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/50">
              No delivery agent assigned yet.
            </div>
          )}

          {/* Assignment Form */}
          {orderStatus !== "DELIVERED" && (!assignedAgent || !isReassignmentLocked) && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between">
                <Label htmlFor="agent-select" className="text-xs font-bold">
                  {assignedAgent ? "Reassign Delivery Agent" : "Assign Delivery Agent"}
                </Label>
                {!isPending && selectedAgentId &&
                  <Button size="sm" asChild className="h-7 px-3 text-xs">
                    <Link href={`/admin/users/${selectedAgentId}`}>
                      Check Agent Details
                    </Link>
                  </Button>
                }
              </div>

              <div className="flex flex-col gap-2 ">
                <Select
                  value={selectedAgentId}
                  onValueChange={setSelectedAgentId}
                  disabled={loadingAgents || isPending}
                >
                  <SelectTrigger id="agent-select" className="flex-1 text-xs h-9">
                    <SelectValue placeholder={loadingAgents ? "Loading agents..." : "Select an agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="text-xs">
                        {agent.firstName} {agent.lastName} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={isPending || !selectedAgentId}
                  className="h-9 px-4 text-xs"
                >
                  {assignedAgent ? "Reassign" : "Assign"}
                </Button>
              </div>
            </div>
          )}

          {orderStatus !== "DELIVERED" && isReassignmentLocked && (
            <div className="text-xs text-muted-foreground bg-zinc-50 p-2.5 rounded border">
              Reassignment is locked because the delivery agent has already started the delivery process (Current Status: <span className="font-semibold">{deliveryStatus}</span>).
            </div>
          )}
        </CardContent></Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold text-rose-600">
            <ShieldAlert className="h-4 w-4" />
            Admin Override (Emergency Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin Emergency Override Form */}
          {isAdmin && assignedAgent && deliveryStatus !== "DELIVERED" && (
            <div className="space-y-3 pt-3 border-t">
              <p className="text-[10px] text-muted-foreground leading-normal">
                Forcing a status transition bypasses validation checks. All overrides are logged in the order history.
              </p>

              <div className="space-y-2.5">
                <Select
                  value={overrideStatus}
                  onValueChange={setOverrideStatus}
                  disabled={isPending}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select target status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSIGNED" className="text-xs">Assigned</SelectItem>
                    <SelectItem value="ACCEPTED" className="text-xs">Accepted</SelectItem>
                    <SelectItem value="PICKED_UP" className="text-xs">Picked Up (Shipped)</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY" className="text-xs">Out for Delivery</SelectItem>
                    <SelectItem value="DELIVERED" className="text-xs">Delivered</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Provide a mandatory reason for auditing..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  disabled={isPending}
                  className="text-xs min-h-[60px]"
                />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleOverride}
                  disabled={isPending || !overrideStatus || !overrideReason.trim()}
                  className="w-full text-xs h-9 bg-rose-600 hover:bg-rose-700"
                >
                  Force Update Status
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card></>
  );
}
