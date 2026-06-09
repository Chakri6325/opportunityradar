import axios from 'axios';

export interface SearchFilters {
  type?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  limit?: number;
}

export async function searchOpportunities(query: string, filters?: SearchFilters): Promise<any[]> {
  try {
    const opportunities: any[] = [];

    // GitHub Jobs
    try {
      const githubResponse = await axios.get('https://jobs.github.com/api/positions.json', {
        params: { description: query, full_time: true },
        timeout: 5000,
      });

      opportunities.push(
        ...githubResponse.data.map((job: any) => ({
          id: `github-${job.id}`,
          title: job.title,
          company_name: job.company,
          type: 'job',
          location: job.location || 'Remote',
          source: 'github',
          source_url: job.url,
          description: job.description,
        }))
      );
    } catch (error) {
      console.warn('⚠️  GitHub Jobs API failed');
    }

    return opportunities;
  } catch (error) {
    console.error('❌ Opportunity search error:', error);
    return [];
  }
}
