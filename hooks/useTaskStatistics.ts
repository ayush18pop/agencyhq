import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface TaskStats {
  totalTimeSpent: number;
  timeSpentToday: number;
  timeSpentThisWeek: number;
  timerCount: number;
  lastWorkedOn: string | null;
}

export function useTaskStats(taskId: string) {
  return useQuery({
    queryKey: ['task_stats', taskId],
    
    queryFn: async (): Promise<TaskStats> => {
      const { data } = await axios.get('/api/getTaskStats', {
        params: { taskId }, 
        withCredentials: true,
      });
      return data;
    },
    
    enabled: !!taskId,
  });
}
