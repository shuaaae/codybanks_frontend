import { buildApiUrl } from '../config/api';

class UserService {
  constructor() {
    this.baseUrl = buildApiUrl('/auth');
  }

  /**
   * Get user profile data from database
   */
  async getUserProfile(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile (${response.status})`);
      }

      const result = await response.json();
      return {
        success: true,
        user: result.user,
        message: 'User profile fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user profile'
      };
    }
  }

  /**
   * Get current user from localStorage and refresh from database
   */
  async getCurrentUserWithPhoto() {
    try {
      // First try to get user from localStorage
      const localUser = localStorage.getItem('currentUser');
      if (!localUser) {
        return {
          success: false,
          error: 'No user found in localStorage',
          message: 'User not logged in'
        };
      }

      const user = JSON.parse(localUser);
      
      // If user has an ID, fetch fresh data from database
      if (user.id) {
        const profileResult = await this.getUserProfile(user.id);
        if (profileResult.success) {
          // Update localStorage with fresh data from database
          const updatedUser = {
            ...user,
            ...profileResult.user,
            // Ensure we have the latest photo from database
            photo: profileResult.user.photo || user.photo
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          return {
            success: true,
            user: updatedUser,
            message: 'User profile refreshed from database'
          };
        }
      }

      // Fallback to localStorage data if datnoabase fetch fails
      return {
        success: true,
        user: user,
        message: 'Using cached user data'
      };
    } catch (error) {
      console.error('Error getting current user with photo:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get current user'
      };
    }
  }

  /**
   * Upload user profile photo
   */
  async uploadPhoto(userId, photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('user_id', userId);

      const response = await fetch(`${this.baseUrl}/upload-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload photo (${response.status})`);
      }

      const result = await response.json();
      return {
        success: true,
        photo: result.photo,
        user: result.user,
        message: 'Photo uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload photo'
      };
    }
  }

  /**
   * Get user photo URL with fallback
   */
  getUserPhotoUrl(user) {
    if (!user) return null;
    
    // If user has a photo URL, return it
    if (user.photo) {
      // Check if it's a full URL or just a path
      if (user.photo.startsWith('http')) {
        return user.photo;
      } else if (user.photo.startsWith('users/')) {
        // Extract filename from users/filename format
        const filename = user.photo.replace('users/', '');
        return `${buildApiUrl('')}/api/user-photo/${filename}`;
      } else {
        // Construct full URL if it's just a path
        return `${buildApiUrl('')}${user.photo}`;
      }
    }
    
    return null;
  }
}

export default new UserService();
