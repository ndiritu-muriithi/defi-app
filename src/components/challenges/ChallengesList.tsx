import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Clock, CheckCircle, XCircle, BadgeCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  getChallenges,
  getChallengeById,
  updateChallenge,
  getGoalById,
  type Challenge
} from '@/lib/db/storage';
import { formatDistanceToNow, format, parseISO, isPast } from 'date-fns';
import { toast } from 'sonner';

const StatusColors = {
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const StatusIcons = {
  active: <Clock className="h-5 w-5 text-blue-600" />,
  completed: <CheckCircle className="h-5 w-5 text-green-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
};

const ChallengesList = () => {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);

  useEffect(() => {
    // Load challenges
    const savedChallenges = getChallenges();
    setChallenges(savedChallenges);
  }, []);

  // Calculate challenge progress
  const calculateProgress = (challenge: Challenge) => {
    if (!challenge.targetAmount || !challenge.currentAmount) {
      return 0;
    }
    return Math.min(100, Math.round((challenge.currentAmount / challenge.targetAmount) * 100));
  };

  // Check if challenge is expired
  const isExpired = (challenge: Challenge) => {
    return isPast(parseISO(challenge.endDate)) && challenge.status === 'active';
  };

  // Handle marking a challenge as complete
  const handleMarkComplete = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsCompleteDialogOpen(true);
  };

  // Handle marking a challenge as failed
  const handleMarkFailed = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsFailDialogOpen(true);
  };

  // Confirm completion
  const confirmComplete = () => {
    if (selectedChallenge) {
      const updatedChallenge = {
        ...selectedChallenge,
        status: 'completed' as const
      };

      updateChallenge(updatedChallenge);
      setChallenges(
        challenges.map(c => c.id === updatedChallenge.id ? updatedChallenge : c)
      );

      toast.success(`Challenge "${selectedChallenge.name}" marked as completed!`);
      setIsCompleteDialogOpen(false);
    }
  };

  // Confirm failure
  const confirmFail = () => {
    if (selectedChallenge) {
      const updatedChallenge = {
        ...selectedChallenge,
        status: 'failed' as const
      };

      updateChallenge(updatedChallenge);
      setChallenges(
        challenges.map(c => c.id === updatedChallenge.id ? updatedChallenge : c)
      );

      toast.info(`Challenge "${selectedChallenge.name}" marked as failed.`);
      setIsFailDialogOpen(false);
    }
  };

  // Handle creating a new challenge
  const handleAddChallenge = () => {
    router.push('/challenges/new');
  };

  // Get goal name if goalId exists
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;

    const goal = getGoalById(goalId);
    return goal ? goal.name : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Savings Challenges</h2>
        <Button onClick={handleAddChallenge}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Challenge
        </Button>
      </div>

      {challenges.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="py-8 space-y-4">
              <Trophy className="mx-auto h-16 w-16 text-amber-500" />
              <h3 className="text-xl font-semibold">No Challenges Yet</h3>
              <p className="text-gray-500">
                Challenge yourself to reach your savings goals faster!
              </p>
              <Button onClick={handleAddChallenge}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className={
              isExpired(challenge) ? 'border-red-200 bg-red-50' : ''
            }>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {challenge.name}
                  </CardTitle>
                  <Badge variant="outline" className={StatusColors[challenge.status]}>
                    <span className="flex items-center gap-1">
                      {StatusIcons[challenge.status]}
                      {challenge.status}
                    </span>
                  </Badge>
                </div>
                <CardDescription>
                  {challenge.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-2">
                {challenge.targetAmount && challenge.currentAmount !== undefined && (
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>
                      <span>{calculateProgress(challenge)}%</span>
                    </div>
                    <Progress value={calculateProgress(challenge)} className="h-2" />
                    <div className="flex justify-between mt-1 text-sm text-gray-500">
                      <span>{challenge.currentAmount.toLocaleString()} USDC</span>
                      <span>{challenge.targetAmount.toLocaleString()} USDC</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reward:</span>
                    <span className="font-medium">{challenge.reward}</span>
                  </div>

                  {challenge.goalId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Related Goal:</span>
                      <span className="font-medium">{getGoalName(challenge.goalId)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deadline:</span>
                    <span className={`font-medium ${isExpired(challenge) ? 'text-red-600' : ''}`}>
                      {isExpired(challenge)
                        ? 'Expired'
                        : formatDistanceToNow(parseISO(challenge.endDate), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                {challenge.status === 'active' && !isExpired(challenge) && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => handleMarkComplete(challenge)}
                    >
                      <BadgeCheck className="mr-1 h-4 w-4" />
                      Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      onClick={() => handleMarkFailed(challenge)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Fail
                    </Button>
                  </div>
                )}

                {challenge.status === 'active' && isExpired(challenge) && (
                  <Button
                    variant="outline"
                    className="w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    onClick={() => handleMarkFailed(challenge)}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Mark as Failed (Expired)
                  </Button>
                )}

                {challenge.status === 'completed' && (
                  <div className="w-full p-2 bg-green-50 rounded-md text-green-700 text-center text-sm">
                    <BadgeCheck className="inline-block mr-1 h-4 w-4" />
                    Challenge completed on {format(parseISO(challenge.endDate), 'MMM d, yyyy')}
                  </div>
                )}

                {challenge.status === 'failed' && (
                  <div className="w-full p-2 bg-red-50 rounded-md text-red-700 text-center text-sm">
                    <XCircle className="inline-block mr-1 h-4 w-4" />
                    Challenge failed on {format(parseISO(challenge.endDate), 'MMM d, yyyy')}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Complete confirmation dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this challenge as completed? You'll earn the reward:
              <span className="block mt-2 font-semibold">{selectedChallenge?.reward}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={confirmComplete}>
              <BadgeCheck className="mr-1 h-4 w-4" />
              Complete Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail confirmation dialog */}
      <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Challenge as Failed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this challenge as failed? You won't receive the reward:
              <span className="block mt-2 font-semibold">{selectedChallenge?.reward}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFailDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmFail}>
              <XCircle className="mr-1 h-4 w-4" />
              Mark as Failed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengesList;
