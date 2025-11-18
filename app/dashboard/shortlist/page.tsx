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
import { NoShortlistState } from "@/components/ui/EmptyState";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { usePageLoadPerformance } from "@/hooks/usePerformance";

interface ShortlistItem {
  id: string;
  cvId: string;
  candidateName: string;
  addedAt: Date;
  notes?: string;
}

export default function ShortlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  usePageLoadPerformance('ShortlistPage');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "shortlists"),
      where("userId", "==", user.uid),
      orderBy("addedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          addedAt: doc.data().addedAt?.toDate() || new Date(),
        })) as ShortlistItem[];

        setShortlist(items);
        setLoading(false);
        logger.info("Shortlist loaded", {
          userId: user.uid,
          count: items.length,
        });
      },
      (error) => {
        logger.error("Failed to load shortlist", error, {
          userId: user.uid,
        });
        toast.error("Failed to load shortlist");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleRemove = async (id: string, candidateName: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "shortlists", id));
      toast.success(`Removed ${candidateName} from shortlist`);
      logger.userAction("remove_from_shortlist", {
        userId: user.uid,
        candidateName,
      });
    } catch (error) {
      logger.error("Failed to remove from shortlist", error as Error, {
        userId: user.uid,
        candidateName,
      });
      toast.error("Failed to remove from shortlist");
    }
  };

  const handleBatchRemove = async () => {
    if (selectedItems.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map((id) =>
          deleteDoc(doc(db, "shortlists", id))
        )
      );
      toast.success(`Removed ${selectedItems.size} candidates from shortlist`);
      setSelectedItems(new Set());
      logger.userAction("batch_remove_from_shortlist", {
        userId: user!.uid,
        count: selectedItems.size,
      });
    } catch (error) {
      logger.error("Failed to batch remove from shortlist", error as Error, {
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
    setSelectedItems(new Set(shortlist.map((item) => item.id)));
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
                  className="text-sm font-medium text-primary-600 border-b-2 border-primary-600 pb-0.5"
                >
                  Shortlist
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shortlisted Candidates</h1>
            <p className="text-gray-600 mt-1">
              {shortlist.length} candidate{shortlist.length !== 1 ? 's' : ''} in your shortlist
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
          {shortlist.length > 0 && selectedItems.size === 0 && (
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
        ) : shortlist.length === 0 ? (
          <Card padding="none">
            <NoShortlistState />
          </Card>
        ) : (
          <div className="space-y-4">
            {shortlist.map((item) => (
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
                          {item.candidateName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Added {item.addedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="success" dot>
                        Shortlisted
                      </Badge>
                    </div>

                    {item.notes && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700">{item.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => router.push(`/dashboard/cv/${item.cvId}`)}
                        variant="primary"
                        size="sm"
                      >
                        View CV
                      </Button>
                      <Button
                        onClick={() => handleRemove(item.id, item.candidateName)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
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
