import { collection, query, where, getDocs, collectionGroup, onSnapshot, or } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Group, CalendarDay, Post } from "../types";

export interface UserStats {
  posts: number;
  devocionais: number;
  grupos: number;
}

export class StatsService {
  static subscribeToUserStats(callback: (stats: UserStats) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    // 1. Subscribe to groups the user is in
    const groupsQuery = query(
      collection(db, "groups"),
      or(
        where("liderId", "==", user.uid),
        where("membros", "array-contains", user.uid)
      )
    );

    return onSnapshot(groupsQuery, async (groupsSnapshot) => {
      const groupIds = groupsSnapshot.docs.map(doc => doc.id);
      const gruposCount = groupIds.length;

      if (gruposCount === 0) {
        callback({ posts: 0, devocionais: 0, grupos: 0 });
        return;
      }

      let totalDays = 0;
      let totalPosts = 0;

      // For each group, we need to count days and posts.
      // Since we want real-time stats, we could set up multiple listeners, 
      // but that might be overkill. Let's do a one-time fetch for now or 
      // implement a more complex nested listener if needed.
      
      // Actually, let's try to use collectionGroup for posts and days if possible, 
      // but they are nested under groups, so we'd need to filter by parent path which is hard in Firestore.
      
      // Alternative: Fetch all days for all groups
      const daysPromises = groupIds.map(async (groupId) => {
        const daysSnap = await getDocs(collection(db, "groups", groupId, "calendar_days"));
        const dayIds = daysSnap.docs.map(d => d.id);
        
        let groupPosts = 0;
        const postsPromises = dayIds.map(async (dayId) => {
          const postsSnap = await getDocs(collection(db, "groups", groupId, "calendar_days", dayId, "posts"));
          return postsSnap.size;
        });
        
        const postsCounts = await Promise.all(postsPromises);
        groupPosts = postsCounts.reduce((acc, curr) => acc + curr, 0);
        
        return { days: daysSnap.size, posts: groupPosts };
      });

      const results = await Promise.all(daysPromises);
      totalDays = results.reduce((acc, curr) => acc + curr.days, 0);
      totalPosts = results.reduce((acc, curr) => acc + curr.posts, 0);

      callback({
        grupos: gruposCount,
        devocionais: totalDays,
        posts: totalPosts
      });
    });
  }
}
