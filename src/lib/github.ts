// frontend/lib/github.ts
import { User } from 'firebase/auth';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  updated_at: string;
}

/**
 * Get GitHub access token from Firebase user
 */
async function getGitHubToken(user: User): Promise<string | null> {
  try {
    // Firebase stores OAuth tokens in providerData
    const githubProvider = user.providerData.find(
      (provider) => provider.providerId === 'github.com'
    );

    if (!githubProvider) {
      console.warn('No GitHub provider found');
      return null;
    }

    // Note: Firebase doesn't directly expose OAuth tokens
    // You need to get them during sign-in or use Firebase Auth getIdToken
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
}

/**
 * Fetch user's GitHub repositories
 */
export async function fetchGitHubRepositories(user: User): Promise<GitHubRepo[]> {
  try {
    // For production, you'll need to:
    // 1. Store GitHub access token during sign-in
    // 2. Or use your backend to fetch repos with GitHub App credentials
    
    // For now, return mock data for development
    console.log('📦 Fetching GitHub repositories for:', user.email);
    
    // In production, replace this with actual API call:
    // const token = await getGitHubToken(user);
    // const response = await fetch('https://api.github.com/user/repos', {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     Accept: 'application/vnd.github.v3+json',
    //   },
    // });
    // return await response.json();

    // Mock data for development
    return [
      {
        id: 123456789,
        name: 'WanderLust',
        full_name: 'Adv-2005/WanderLust',
        description: 'A travel planning and booking platform',
        private: false,
        owner: {
          login: 'Adv-2005',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adv',
        },
        html_url: 'https://github.com/Adv-2005/WanderLust',
        language: 'TypeScript',
        stargazers_count: 45,
        forks_count: 12,
        default_branch: 'main',
        updated_at: new Date().toISOString(),
      },
      {
        id: 987654321,
        name: 'ai-docgen',
        full_name: 'Adv-2005/ai-docgen',
        description: 'AI-powered documentation generator',
        private: false,
        owner: {
          login: 'Adv-2005',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adv',
        },
        html_url: 'https://github.com/Adv-2005/ai-docgen',
        language: 'TypeScript',
        stargazers_count: 23,
        forks_count: 5,
        default_branch: 'main',
        updated_at: new Date().toISOString(),
      },
      {
        id: 555555555,
        name: 'portfolio',
        full_name: 'Adv-2005/portfolio',
        description: 'Personal portfolio website',
        private: false,
        owner: {
          login: 'Adv-2005',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adv',
        },
        html_url: 'https://github.com/Adv-2005/portfolio',
        language: 'JavaScript',
        stargazers_count: 8,
        forks_count: 2,
        default_branch: 'main',
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
}

/**
 * Setup webhook for a repository
 * In production, this should call your backend API
 */
export async function setupWebhook(repoFullName: string): Promise<{
  webhookId: string;
  webhookSecret: string;
}> {
  try {
    console.log('🔗 Setting up webhook for:', repoFullName);

    // In production, call your backend:
    // const response = await fetch('/api/webhooks/setup', {
    //   method: 'POST',
    //   body: JSON.stringify({ repoFullName }),
    // });
    // return await response.json();

    // Mock response for development
    return {
      webhookId: `webhook_${Date.now()}`,
      webhookSecret: `secret_${Math.random().toString(36).substring(7)}`,
    };
  } catch (error) {
    console.error('Error setting up webhook:', error);
    throw error;
  }
}

/**
 * Trigger initial repository analysis
 */
export async function triggerInitialAnalysis(repoFullName: string): Promise<void> {
  try {
    console.log('🔍 Triggering initial analysis for:', repoFullName);

    // In production, call your backend:
    // await fetch('/api/jobs/trigger', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     jobType: 'initial-ingestion',
    //     repoFullName,
    //   }),
    // });

    // For development, the webhook simulation will handle this
    console.log('✅ Analysis job queued');
  } catch (error) {
    console.error('Error triggering analysis:', error);
    throw error;
  }
}