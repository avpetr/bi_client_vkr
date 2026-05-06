// User Profile Service - manages user data and roles

const USER_PROFILE_KEY = 'bi_user_profile';

// User roles
export const UserRoles = {
    CREATOR: 'creator',
    VIEWER: 'viewer'
};

// Default user profile
const defaultProfile = {
    firstName: 'Иван',
    lastName: 'Иванов',
    username: 'user',
    role: UserRoles.CREATOR,
    email: '',
    createdAt: new Date().toISOString()
};

// Get user profile
export const getUserProfile = () => {
    try {
        const data = localStorage.getItem(USER_PROFILE_KEY);
        return data ? JSON.parse(data) : defaultProfile;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return defaultProfile;
    }
};

// Save user profile
export const saveUserProfile = (profile) => {
    try {
        const updatedProfile = {
            ...profile,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
        return updatedProfile;
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
};

// Check if user has permission
export const hasPermission = (action) => {
    const profile = getUserProfile();
    
    const permissions = {
        [UserRoles.CREATOR]: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
            canUploadCSV: true,
            canManageDashboards: true,
            canConfigureWidgets: true
        },
        [UserRoles.VIEWER]: {
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canView: true,
            canUploadCSV: false,
            canManageDashboards: false,
            canConfigureWidgets: false
        }
    };
    
    const rolePermissions = permissions[profile.role] || permissions[UserRoles.VIEWER];
    return rolePermissions[action] || false;
};

// Check specific permissions
export const canCreate = () => hasPermission('canCreate');
export const canEdit = () => hasPermission('canEdit');
export const canDelete = () => hasPermission('canDelete');
export const canView = () => hasPermission('canView');
export const canUploadCSV = () => hasPermission('canUploadCSV');
export const canManageDashboards = () => hasPermission('canManageDashboards');
export const canConfigureWidgets = () => hasPermission('canConfigureWidgets');

// Get user display name
export const getUserDisplayName = () => {
    const profile = getUserProfile();
    return `${profile.firstName} ${profile.lastName}`.trim() || profile.username;
};

// Backend API stubs (for future integration)
export const apiStubs = {
    // Login user
    login: async (username, password) => {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/auth/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password })
        // });
        // const data = await response.json();
        // saveUserProfile(data.user);
        // return data;
        
        console.log('API stub: login', { username, password });
        return Promise.resolve({ success: true, user: getUserProfile() });
    },
    
    // Logout user
    logout: async () => {
        // TODO: Replace with actual API call
        // await fetch('/api/auth/logout', { method: 'POST' });
        
        console.log('API stub: logout');
        return Promise.resolve({ success: true });
    },
    
    // Get user profile from server
    fetchProfile: async () => {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/user/profile');
        // const data = await response.json();
        // return data;
        
        console.log('API stub: fetchProfile');
        return Promise.resolve(getUserProfile());
    },
    
    // Update user profile on server
    updateProfile: async (profile) => {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/user/profile', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(profile)
        // });
        // const data = await response.json();
        // return data;
        
        console.log('API stub: updateProfile', profile);
        saveUserProfile(profile);
        return Promise.resolve(profile);
    },
    
    // Check authentication status
    checkAuth: async () => {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/auth/check');
        // const data = await response.json();
        // return data.authenticated;
        
        console.log('API stub: checkAuth');
        return Promise.resolve(true);
    }
};




