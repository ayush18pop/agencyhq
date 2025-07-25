import {useQuery} from '@tanstack/react-query';
import axios from 'axios';

export function useProjects(limit:number|undefined){
    return useQuery(
        {
            queryKey: ['projects',limit],
            queryFn: async ()=>{
                const res = await axios.post('/api/getProjects', {limit},{withCredentials: true} );
                return res.data.projects;
            },
            staleTime: 1000*60*5,
        }
    )
}