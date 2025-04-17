import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, ArrowUpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getGoals, type SavingsGoal, deleteGoal } from '@/lib/db/storage';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const GoalTypeColors = {
  land: 'bg-amber-100 text-amber-800 border-amber-200',
  business: 'bg-blue-100 text-blue-800 border-blue-200',
  savings: 'bg-green-100 text-green-800 border-green-200',
  crypto: 'bg-purple-100 text-purple-800 border-purple-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const StatusColors = {
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PriorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

const GoalsList = () => {
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // Load goals from storage
    const savedGoals = getGoals();
    setGoals(savedGoals);
  }, []);

  const handleAddGoal = () => {
    router.push('/goals/new');
  };

  const handleEditGoal = (id: string) => {
    router.push(`/goals/edit/${id}`);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/goals/${id}`);
  };

  const handleDeleteConfirm = () => {
    if (selectedGoal) {
      const success = deleteGoal(selectedGoal.id);
      if (success) {
        setGoals(goals.filter(goal => goal.id !== selectedGoal.id));
        toast.success(`Goal "${selectedGoal.name}" deleted successfully`);
      } else {
        toast.error('Failed to delete goal');
      }
      setIsDeleteDialogOpen(false);
      setSelectedGoal(null);
    }
  };

  const confirmDelete = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsDeleteDialogOpen(true);
  };

  const calculateProgress = (goal: SavingsGoal) => {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  };

  const formatReminderFrequency = (freq?: string) => {
    if (!freq) return 'None';
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your Savings Goals</h2>
        <Button onClick={handleAddGoal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="py-8 space-y-4">
              <h3 className="text-xl font-semibold">No Goals Yet</h3>
              <p className="text-gray-500">
                Get started by creating your first savings goal.
              </p>
              <Button onClick={handleAddGoal}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{goal.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Badge variant="outline" className={PriorityColors[goal.priority]}>
                      {goal.priority}
                    </Badge>
                    <Badge variant="outline" className={StatusColors[goal.status]}>
                      {goal.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  <Badge variant="outline" className={GoalTypeColors[goal.type]}>
                    {goal.type}
                  </Badge>
                  <span className="block mt-2 text-sm">{goal.description}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>
                      <span>{calculateProgress(goal)}%</span>
                    </div>
                    <Progress value={calculateProgress(goal)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current</p>
                      <p className="font-semibold">{goal.currentAmount.toLocaleString()} USDC</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Target</p>
                      <p className="font-semibold">{goal.targetAmount.toLocaleString()} USDC</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Started</p>
                      <p className="font-semibold">{formatDistanceToNow(new Date(goal.startDate), { addSuffix: true })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Reminders</p>
                      <p className="font-semibold">{formatReminderFrequency(goal.reminderFrequency)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(goal.id)}>
                  <Info className="mr-1 h-4 w-4" />
                  Details
                </Button>
                <div className="space-x-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditGoal(goal.id)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => confirmDelete(goal)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete goal "{selectedGoal?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsList;
