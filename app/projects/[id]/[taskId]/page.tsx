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
import { useTaskStats } from "../../../../hooks/useTaskStatistics"; 

interface TaskDetails {
  taskId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: { id: string; name: string; };
  timeLogs: TimeLog[];
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
  timeSpentToday: number;
  timeSpentThisWeek: number;
}

interface ActiveTimerResponse {
  id: string;
  startTime: string;
  taskId: string;
}


const fetchTaskDetails = async (taskId: string): Promise<TaskDetails> => {
  const { data } = await axios.get(`/api/getTask?taskId=${taskId}`);
  return data.task;
};

const fetchActiveTimer = async (): Promise<ActiveTimerResponse | null> => {
  const { data } = await axios.get('/api/timers/active');
  return data.activeTimer;
};


function useTaskTimer(taskId: string) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkTimer = async () => {
      const activeTimer = await fetchActiveTimer();
      if (activeTimer && activeTimer.taskId === taskId) {
        setActiveTimerId(activeTimer.id);
        const start = new Date(activeTimer.startTime).getTime();
        setElapsedTime(Math.round((new Date().getTime() - start) / 1000));
        setIsRunning(true);
      }
    };
    if (taskId) checkTimer();
  }, [taskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
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
      toast.error(error.response?.data?.error || "Failed to start timer.");
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
      // After stopping, refetch both the task details and the stats to update the UI.
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task_stats', taskId] });
    } catch (error) {
      toast.error("Failed to stop timer.");
    }
  };

  return { isRunning, elapsedTime, handleStartTimer, handleStopTimer };
}

const formatTime = (totalSeconds: number) => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const TaskDetailsCard = ({ task }: { task: TaskDetails }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-3xl">{task.title}</CardTitle>
      <CardDescription>{task.description || "No description provided."}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="font-semibold">Status</p><p className="text-muted-foreground">{task.status}</p></div>
        <div><p className="font-semibold">Priority</p><p className="text-muted-foreground">{task.priority}</p></div>
        <div><p className="font-semibold">Assignee</p><p className="text-muted-foreground">{task.assignedTo.name}</p></div>
      </div>
    </CardContent>
  </Card>
);

const TaskStatisticsCard = ({ stats, isLoading }: { stats?: TaskStatistics, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent><div className="grid grid-cols-3 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
            </Card>
        )
    }
    if (!stats) return null;

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5" /> Statistics</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="font-semibold">Total Time</p><p className="text-muted-foreground font-mono">{formatTime(stats.totalTimeSpent)}</p></div>
                    <div><p className="font-semibold">Today</p><p className="text-muted-foreground font-mono">{formatTime(stats.timeSpentToday)}</p></div>
                    <div><p className="font-semibold">This Week</p><p className="text-muted-foreground font-mono">{formatTime(stats.timeSpentThisWeek)}</p></div>
                    <div><p className="font-semibold">Sessions</p><p className="text-muted-foreground">{stats.timerCount}</p></div>
                    <div><p className="font-semibold">Last Worked</p><p className="text-muted-foreground">{stats.lastWorkedOn ? new Date(stats.lastWorkedOn).toLocaleDateString() : 'N/A'}</p></div>
                </div>
            </CardContent>
        </Card>
    );
};

const TimeLogHistoryCard = ({ timeLogs }: { timeLogs: TimeLog[] }) => (
    <Card>
        <CardHeader><CardTitle>Time Log History</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {timeLogs.length > 0 ? timeLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                        <p className="font-mono">{new Date(log.startTime).toLocaleString()}</p>
                        <p className="font-semibold font-mono">{log.duration ? formatTime(log.duration) : 'In Progress'}</p>
                    </div>
                )) : <p className="text-muted-foreground text-center py-4">No time has been logged.</p>}
            </div>
        </CardContent>
    </Card>
);

const TimerControlCard = ({ isRunning, elapsedTime, onStart, onStop, isAssigned }: { isRunning: boolean, elapsedTime: number, onStart: () => void, onStop: () => void, isAssigned: boolean }) => (
    <Card>
        <CardHeader className="text-center"><CardTitle>Track Time</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center bg-muted rounded-lg p-4 w-full">
                <TimerIcon className="h-8 w-8 mr-4 text-muted-foreground" />
                <span className="text-4xl font-mono font-bold tracking-wider">{formatTime(elapsedTime)}</span>
            </div>
            {!isRunning ? (
                <Button size="lg" className="w-full" onClick={onStart} disabled={!isAssigned}><Play className="mr-2 h-5 w-5" /> Start Timer</Button>
            ) : (
                <Button size="lg" className="w-full" variant="destructive" onClick={onStop}><Square className="mr-2 h-5 w-5" /> Stop Timer</Button>
            )}
            {!isAssigned && <p className="text-xs text-center text-muted-foreground pt-2">You can only track time for assigned tasks.</p>}
        </CardContent>
    </Card>
);

export default function TaskPage() {
  const params = useParams();
  const { data: session } = useSession();
  const taskId = typeof params.taskId === "string" ? params.taskId : "";

  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskDetails(taskId),
    enabled: !!taskId,
  });

  const { data: taskStats, isLoading: isStatsLoading } = useTaskStats(taskId);

  const { isRunning, elapsedTime, handleStartTimer, handleStopTimer } = useTaskTimer(taskId);
  
  if (isTaskLoading) return <TaskPageSkeleton />;
  
  if (!task) return <div className="p-8 text-center">Task not found.</div>;

  const isAssignedToCurrentUser = task.assignedTo.id === session?.user?.id;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Toaster richColors />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <TaskDetailsCard task={task} />
          <TaskStatisticsCard stats={taskStats} isLoading={isStatsLoading} />
          <TimeLogHistoryCard timeLogs={task.timeLogs} />
        </div>
        <div className="md:col-span-1">
          <TimerControlCard 
            isRunning={isRunning}
            elapsedTime={elapsedTime}
            onStart={handleStartTimer}
            onStop={handleStopTimer}
            isAssigned={isAssignedToCurrentUser}
          />
        </div>
      </div>
    </div>
  );
}

// --- SKELETON COMPONENT ---
function TaskPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card><CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><div className="grid grid-cols-3 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
        </div>
        <div className="md:col-span-1">
          <Card><CardHeader className="items-center"><Skeleton className="h-6 w-1/2 mx-auto" /></CardHeader><CardContent className="flex flex-col items-center space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
