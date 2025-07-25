import { useQuery } from "@tanstack/react-query";
import axios from "axios";
export function useProjectsStats(){
    return useQuery(
        {
            queryKey: ['project_stats'],
            queryFn: async ()=>{
                const res = await axios.get('/api/dashboard/stats', {withCredentials: true});
                return res;
            }

        }
    )
}