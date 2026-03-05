import { ApifyClient } from 'apify-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || !url.includes('linkedin.com/in/')) {
            return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
        }

        const token = process.env.APIFY_API_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'Apify API token not configured' }, { status: 500 });
        }

        const client = new ApifyClient({ token });

        // Run the LinkedIn Profile Scraper Actor
        const run = await client.actor('2SyF0bVxmgGr8IVCZ').call({
            profileUrls: [url],
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Could not fetch profile data' }, { status: 404 });
        }

        const profile = items[0] as Record<string, unknown>;

        // Extract and normalize the data we need for the dashboard
        const data = {
            name: profile.fullName || profile.firstName
                ? `${profile.firstName} ${profile.lastName}`.trim()
                : 'User',
            headline: profile.headline || 'Professional',
            location: profile.location || '',
            about: profile.summary || profile.about || '',
            followers: profile.followersCount || 0,
            connections: profile.connectionsCount || 0,
            profileViews: profile.profileViewsCount || 0,
            profilePicture: profile.profilePicture || profile.photoUrl || null,
            skills: (profile.skills as Array<{ name: string }> || []).slice(0, 12).map((s) => s.name || s),
            experience: (profile.positions as Array<Record<string, unknown>> || []).slice(0, 5).map((e) => ({
                title: e.title,
                company: e.companyName,
                duration: e.duration || '',
                location: e.location || '',
            })),
            education: (profile.educations as Array<Record<string, unknown>> || []).slice(0, 3).map((e) => ({
                school: e.schoolName,
                degree: e.degreeName || '',
                field: e.fieldOfStudy || '',
            })),
            certifications: (profile.certifications as Array<Record<string, unknown>> || []).slice(0, 4),
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract profile. Please try again.' },
            { status: 500 }
        );
    }
}
