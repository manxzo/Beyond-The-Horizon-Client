import { useAdminSponsor } from './useAdminSponsor';
import { useAdminSupportGroup } from './useAdminSupportGroup';
import { useAdminResource } from './useAdminResource';
import { useAdminReport } from './useAdminReport';
import { useAdminUser } from './useAdminUser';
import { useAdminStats } from './useAdminStats';

/**
 * Combined hook that provides access to all admin functionality
 */
export function useAdmin() {
    const sponsorAdmin = useAdminSponsor();
    const supportGroupAdmin = useAdminSupportGroup();
    const resourceAdmin = useAdminResource();
    const reportAdmin = useAdminReport();
    const userAdmin = useAdminUser();
    const statsAdmin = useAdminStats();

    return {
        // Sponsor administration
        ...sponsorAdmin,
        
        // Support group administration
        ...supportGroupAdmin,
        
        // Resource administration
        ...resourceAdmin,
        
        // Report administration
        ...reportAdmin,
        
        // User administration
        ...userAdmin,
        
        // Stats
        ...statsAdmin,
    };
} 