import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, ArrowRight, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getReminders,
  getPendingReminders,
  acknowledgeReminder,
  getGoalById,
  type Reminder,
  generateRemindersForGoals
} from '@/lib/db/storage';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const RemindersList = () => {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Generate any new reminders based on goals
    generateRemindersForGoals();

    // Load all reminders
    loadReminders();

    // Set up a timer to refresh reminders every minute
    const timer = setInterval(() => {
      loadReminders();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadReminders = () => {
    const allReminders = getReminders();
    const pending = getPendingReminders();

    setReminders(allReminders);
    setPendingCount(pending.length);
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeReminder(id);
    toast.success('Reminder acknowledged');
    loadReminders();
  };

  const getGoalName = (goalId: string) => {
    const goal = getGoalById(goalId);
    return goal ? goal.name : 'Unknown Goal';
  };

  const goToGoal = (goalId: string) => {
    router.push(`/goals/${goalId}`);
  };

  // Get pending reminders sorted by date (newest first)
  const pendingReminders = reminders
    .filter(r => !r.acknowledged)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Get acknowledged reminders sorted by date (newest first), limit to 5
  const acknowledgedReminders = reminders
    .filter(r => r.acknowledged)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your Reminders</h2>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-white">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {pendingReminders.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="p-6 text-center">
              <Bell className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Pending Reminders</h3>
              <p className="text-gray-500 mt-2">
                You're all caught up! Reminders will appear here when it's time to contribute to your goals.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Bell className="mr-2 h-5 w-5 text-amber-500" />
              Pending Reminders
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {pendingReminders.map((reminder) => (
                <Card key={reminder.id} className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        {getGoalName(reminder.goalId)}
                      </CardTitle>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(parseISO(reminder.date), { addSuffix: true })}
                      </Badge>
                    </div>
                    <CardDescription>
                      {reminder.message}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="pt-2 flex justify-between">
                    <Button variant="ghost" size="sm" onClick={() => goToGoal(reminder.goalId)}>
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Go to Goal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => handleAcknowledge(reminder.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {acknowledgedReminders.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Recently Acknowledged
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {acknowledgedReminders.map((reminder) => (
                <Card key={reminder.id} className="border-gray-200 bg-gray-50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        {getGoalName(reminder.goalId)}
                      </CardTitle>
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(parseISO(reminder.date), { addSuffix: true })}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-500">
                      {reminder.message}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" onClick={() => goToGoal(reminder.goalId)}>
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Go to Goal
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersList;
