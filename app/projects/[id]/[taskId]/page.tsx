"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Play, Square, TimerIcon, BarChart2 } from "lucide-react";

// --- Interfaces for our data (Updated to match API response) ---
interface TaskDetails {
  taskId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: {
    id: string;
    name: string;
  };
  // FIX: Changed from Timer to timeLogs to match the Prisma schema relation
  timeLogs: TimeLog[]; 
  statistics: TaskStatistics; 
}

interface TimeLog {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

interface TaskStatistics {
    totalTimeSpent: number;
    timerCount: number;
    lastWorkedOn: string | null;
    isOverdue: boolean;
    daysUntilDue: number | null;
    timeSpentToday: number;
    timeSpentThisWeek: number;
}

interface ActiveTimerResponse {
    id: string;
    startTime: string;
    taskId: string;
}

// --- API Fetching Functions (Updated to match API endpoint) ---
const fetchTaskDetails = async (taskId: string): Promise<TaskDetails> => {
  // FIX: Changed API endpoint from /api/tasks to /api/getTask
  const { data } = await axios.get(`/api/getTask?taskId=${taskId}`);
  return data.task;
};

const fetchActiveTimer = async (): Promise<ActiveTimerResponse | null> => {
    const { data } = await axios.get('/api/timers/active');
    return data.activeTimer;
}

// --- The Main Page Component ---
export default function TaskPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const taskId = typeof params.taskId === "string" ? params.taskId : "";

  // --- State for the Timer ---
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Data Fetching with TanStack Query ---
  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskDetails(taskId),
    enabled: !!taskId,
  });

  // --- Timer Logic (No changes needed here) ---
  useEffect(() => {
    const checkTimer = async () => {
        try {
            const activeTimer = await fetchActiveTimer();
            if (activeTimer && activeTimer.taskId === taskId) {
                setActiveTimerId(activeTimer.id);
                const start = new Date(activeTimer.startTime).getTime();
                const now = new Date().getTime();
                setElapsedTime(Math.round((now - start) / 1000));
                setIsRunning(true);
            }
        } catch (error) {
            console.error("Could not fetch active timer", error);
        }
    };
    if (taskId) {
        checkTimer();
    }
  }, [taskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStartTimer = async () => {
    try {
      const response = await axios.post('/api/timers', { taskId });
      setActiveTimerId(response.data.timer.id);
      setIsRunning(true);
      toast.success("Timer started!");
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to start timer.");
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimerId) return;
    try {
      await axios.put(`/api/timers/${activeTimerId}`);
      setIsRunning(false);
      setElapsedTime(0);
      setActiveTimerId(null);
      toast.success("Time session saved!");
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    } catch (error) {
      toast.error("Failed to stop timer.");
    }
  };

  // --- Helper Functions ---
  const formatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const isAssignedToCurrentUser = task?.assignedTo.id === session?.user?.id;

  // --- Render Logic ---
  if (isTaskLoading) {
    return <TaskPageSkeleton />;
  }

  if (!task) {
    return <div className="p-8 text-center">Task not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Toaster richColors />
      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Task Details Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{task.title}</CardTitle>
              <CardDescription>{task.description || "No description provided."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Status</p>
                  <p className="text-muted-foreground">{task.status}</p>
                </div>
                <div>
                  <p className="font-semibold">Priority</p>
                  <p className="text-muted-foreground">{task.priority}</p>
                </div>
                <div>
                  <p className="font-semibold">Assignee</p>
                  <p className="text-muted-foreground">{task.assignedTo.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5" /> Statistics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">Total Time Spent</p>
                        <p className="text-muted-foreground font-mono">{formatTime(task.statistics.totalTimeSpent)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Time Spent Today</p>
                        <p className="text-muted-foreground font-mono">{formatTime(task.statistics.timeSpentToday)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Time Spent This Week</p>
                        <p className="text-muted-foreground font-mono">{formatTime(task.statistics.timeSpentThisWeek)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Sessions</p>
                        <p className="text-muted-foreground">{task.statistics.timerCount}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Last Worked On</p>
                        <p className="text-muted-foreground">{task.statistics.lastWorkedOn ? new Date(task.statistics.lastWorkedOn).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Log History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* FIX: Use task.timeLogs to match the corrected interface */}
                    {task.timeLogs && task.timeLogs.length > 0 ? (
                        task.timeLogs.map(log => (
                            <div key={log.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-mono">
                                        {new Date(log.startTime).toLocaleString()}
                                    </p>
                                </div>
                                <p className="font-semibold font-mono">
                                    {log.duration ? formatTime(log.duration) : 'In Progress'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No time has been logged for this task.</p>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Timer Column */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Track Time</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center bg-muted rounded-lg p-4 w-full">
                <TimerIcon className="h-8 w-8 mr-4 text-muted-foreground" />
                <span className="text-4xl font-mono font-bold tracking-wider">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              {!isRunning ? (
                <Button size="lg" className="w-full" onClick={handleStartTimer} disabled={!isAssignedToCurrentUser}>
                  <Play className="mr-2 h-5 w-5" /> Start Timer
                </Button>
              ) : (
                <Button size="lg" className="w-full" variant="destructive" onClick={handleStopTimer}>
                  <Square className="mr-2 h-5 w-5" /> Stop Timer
                </Button>
              )}
               {!isAssignedToCurrentUser && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                    You can only track time for tasks assigned to you.
                </p>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Skeleton Component for Loading State (Updated) ---
function TaskPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          {/* NEW: Skeleton for Statistics Card */}
          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center">
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
