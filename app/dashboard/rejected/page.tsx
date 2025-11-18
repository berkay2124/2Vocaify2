"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { usePageLoadPerformance } from "@/hooks/usePerformance";

interface RejectedItem {
  id: string;
  cvId: string;
  candidateName?: string;
  rejectedAt: Date;
  reason?: string;
}

export default function RejectedPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rejected, setRejected] = useState<RejectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  usePageLoadPerformance('RejectedPage');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !userProfile?.organizationId) return;

    const q = query(
      collection(db, "rejected"),
      where("organizationId", "==", userProfile.organizationId),
      orderBy("rejectedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          rejectedAt: doc.data().rejectedAt?.toDate() || new Date(),
        })) as RejectedItem[];

        setRejected(items);
        setLoading(false);
        logger.info("Rejected list loaded", {
          userId: user.uid,
          count: items.length,
        });
      },
      (error) => {
        logger.error("Failed to load rejected list", error, {
          userId: user.uid,
        });
        toast.error("Failed to load rejected candidates");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  const handleRemove = async (id: string, candidateName?: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "rejected", id));
      toast.success(`Removed ${candidateName || 'candidate'} from rejected list`);
      logger.userAction("remove_from_rejected", {
        userId: user.uid,
        candidateName,
      });
    } catch (error) {
      logger.error("Failed to remove from rejected list", error as Error, {
        userId: user.uid,
      });
      toast.error("Failed to remove candidate");
    }
  };

  const handleBatchRemove = async () => {
    if (selectedItems.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map((id) =>
          deleteDoc(doc(db, "rejected", id))
        )
      );
      toast.success(`Removed ${selectedItems.size} candidates from rejected list`);
      setSelectedItems(new Set());
      logger.userAction("batch_remove_from_rejected", {
        userId: user!.uid,
        count: selectedItems.size,
      });
    } catch (error) {
      logger.error("Failed to batch remove from rejected", error as Error, {
        userId: user!.uid,
      });
      toast.error("Failed to remove candidates");
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(rejected.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
                Vocaify
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/upload"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Upload
                </Link>
                <Link
                  href="/dashboard/search"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Search
                </Link>
                <Link
                  href="/dashboard/shortlist"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Shortlist
                </Link>
                <Link
                  href="/dashboard/rejected"
                  className="text-sm font-medium text-primary-600 border-b-2 border-primary-600 pb-0.5"
                >
                  Rejected
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rejected Candidates</h1>
            <p className="text-gray-600 mt-1">
              {rejected.length} candidate{rejected.length !== 1 ? 's' : ''} rejected
            </p>
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedItems.size} selected
              </span>
              <Button onClick={handleBatchRemove} variant="danger" size="sm">
                Remove Selected
              </Button>
              <Button onClick={deselectAll} variant="ghost" size="sm">
                Deselect All
              </Button>
            </div>
          )}
          {rejected.length > 0 && selectedItems.size === 0 && (
            <Button onClick={selectAll} variant="outline" size="sm">
              Select All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="lg">
                <div className="flex items-start gap-4">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1 space-y-3">
                    <Skeleton width="40%" />
                    <Skeleton width="60%" />
                    <Skeleton width="80%" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : rejected.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              title="No rejected candidates"
              description="Candidates you reject during your search will appear here."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {rejected.map((item) => (
              <Card
                key={item.id}
                padding="lg"
                className={`transition-all duration-200 ${
                  selectedItems.has(item.id)
                    ? 'ring-2 ring-primary-500 border-primary-300'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.candidateName || 'Unknown Candidate'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Rejected {item.rejectedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="error" dot>
                        Rejected
                      </Badge>
                    </div>

                    {item.reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{item.reason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleRemove(item.id, item.candidateName)}
                        variant="outline"
                        size="sm"
                      >
                        Remove from List
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
