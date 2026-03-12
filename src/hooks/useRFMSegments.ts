import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subMonths } from "date-fns";

export interface CustomerRFM {
  userId: string;
  email: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: string;
}

export interface SegmentSummary {
  name: string;
  count: number;
  emails: string[];
  color: string;
}

export const SEGMENT_COLORS: Record<string, string> = {
  "Champions": "hsl(142, 76%, 36%)",
  "Loyal Customers": "hsl(142, 69%, 58%)",
  "Potential Loyalists": "hsl(200, 98%, 39%)",
  "Recent Customers": "hsl(200, 74%, 60%)",
  "Promising": "hsl(280, 67%, 55%)",
  "Need Attention": "hsl(45, 93%, 47%)",
  "About to Sleep": "hsl(30, 100%, 50%)",
  "At Risk": "hsl(15, 100%, 55%)",
  "Can't Lose Them": "hsl(0, 84%, 60%)",
  "Hibernating": "hsl(0, 0%, 60%)",
  "Lost": "hsl(0, 0%, 40%)",
};

const getSegment = (r: number, f: number, m: number): string => {
  if (r >= 4 && f >= 4 && m >= 4) return "Champions";
  if (f >= 4 && m >= 3) return "Loyal Customers";
  if (r >= 4 && f >= 2 && f <= 4) return "Potential Loyalists";
  if (r >= 4 && f <= 2) return "Recent Customers";
  if (r >= 3 && f <= 2 && m <= 2) return "Promising";
  if (r >= 2 && r <= 3 && f >= 2 && f <= 3 && m >= 2 && m <= 3) return "Need Attention";
  if (r <= 2 && f <= 2) return "About to Sleep";
  if (r <= 2 && f >= 3 && m >= 3) return "At Risk";
  if (r <= 2 && (f >= 4 || m >= 4)) return "Can't Lose Them";
  if (r <= 2 && f <= 2) return "Hibernating";
  if (r === 1 && f === 1) return "Lost";
  return "Need Attention";
};

const calculateScore = (value: number, thresholds: number[]): number => {
  if (value <= thresholds[0]) return 1;
  if (value <= thresholds[1]) return 2;
  if (value <= thresholds[2]) return 3;
  if (value <= thresholds[3]) return 4;
  return 5;
};

export const useRFMSegments = (months: number = 12) => {
  const [customers, setCustomers] = useState<CustomerRFM[]>([]);
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFMData();
  }, [months]);

  const fetchRFMData = async () => {
    setLoading(true);
    const startDate = subMonths(new Date(), months);

    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("id, user_id, email, total, created_at, status")
        .gte("created_at", startDate.toISOString())
        .in("status", ["delivered", "shipped", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!ordersData || ordersData.length === 0) {
        setCustomers([]);
        setSegments([]);
        setLoading(false);
        return;
      }

      const customerOrders: Record<string, { orders: typeof ordersData, userId: string | null }> = {};
      
      ordersData.forEach(order => {
        const key = order.email;
        if (!customerOrders[key]) {
          customerOrders[key] = { orders: [], userId: order.user_id };
        }
        customerOrders[key].orders.push(order);
      });

      const now = new Date();
      const customerRFMs: CustomerRFM[] = [];
      
      Object.entries(customerOrders).forEach(([email, { orders, userId }]) => {
        const mostRecentOrder = new Date(orders[0].created_at);
        const recencyDays = differenceInDays(now, mostRecentOrder);
        const frequency = orders.length;
        const monetary = orders.reduce((sum, o) => sum + Number(o.total), 0);
        
        customerRFMs.push({
          userId: userId || email,
          email,
          recencyDays,
          frequency,
          monetary,
          rScore: 0,
          fScore: 0,
          mScore: 0,
          rfmScore: 0,
          segment: "",
        });
      });

      const recencyValues = customerRFMs.map(c => c.recencyDays).sort((a, b) => a - b);
      const frequencyValues = customerRFMs.map(c => c.frequency).sort((a, b) => a - b);
      const monetaryValues = customerRFMs.map(c => c.monetary).sort((a, b) => a - b);

      const getPercentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p)] || arr[0];

      const rThresholds = [
        getPercentile(recencyValues, 0.8),
        getPercentile(recencyValues, 0.6),
        getPercentile(recencyValues, 0.4),
        getPercentile(recencyValues, 0.2),
      ];

      const fThresholds = [
        getPercentile(frequencyValues, 0.2),
        getPercentile(frequencyValues, 0.4),
        getPercentile(frequencyValues, 0.6),
        getPercentile(frequencyValues, 0.8),
      ];

      const mThresholds = [
        getPercentile(monetaryValues, 0.2),
        getPercentile(monetaryValues, 0.4),
        getPercentile(monetaryValues, 0.6),
        getPercentile(monetaryValues, 0.8),
      ];

      customerRFMs.forEach(customer => {
        customer.rScore = 6 - calculateScore(customer.recencyDays, rThresholds);
        customer.fScore = calculateScore(customer.frequency, fThresholds);
        customer.mScore = calculateScore(customer.monetary, mThresholds);
        customer.rfmScore = customer.rScore * 100 + customer.fScore * 10 + customer.mScore;
        customer.segment = getSegment(customer.rScore, customer.fScore, customer.mScore);
      });

      customerRFMs.sort((a, b) => b.rfmScore - a.rfmScore);
      setCustomers(customerRFMs);

      // Build segment summaries with emails
      const segmentMap: Record<string, string[]> = {};
      customerRFMs.forEach(c => {
        if (!segmentMap[c.segment]) segmentMap[c.segment] = [];
        segmentMap[c.segment].push(c.email);
      });

      const segmentData: SegmentSummary[] = Object.entries(segmentMap).map(([name, emails]) => ({
        name,
        count: emails.length,
        emails,
        color: SEGMENT_COLORS[name] || "hsl(0, 0%, 50%)",
      }));

      segmentData.sort((a, b) => b.count - a.count);
      setSegments(segmentData);

    } catch (error) {
      console.error("Error fetching RFM data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmailsBySegments = (segmentNames: string[]): string[] => {
    const emails = new Set<string>();
    customers.forEach(c => {
      if (segmentNames.includes(c.segment)) {
        emails.add(c.email);
      }
    });
    return Array.from(emails);
  };

  return { customers, segments, loading, getEmailsBySegments, refetch: fetchRFMData };
};
