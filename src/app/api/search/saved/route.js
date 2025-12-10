import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import SavedSearch from '../../../../../models/SavedSearch.js';

// Save a search
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, filters, name } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const savedSearch = await SavedSearch.create({
      userId: user._id,
      query,
      filters: filters || {},
      name: name || query.substring(0, 50),
    });

    return NextResponse.json({
      message: 'Search saved successfully',
      savedSearch,
    });
  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save search' },
      { status: 500 }
    );
  }
}

// Get saved searches
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const savedSearches = await SavedSearch.find({
      userId: user._id,
    })
      .sort({ lastSearchedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      savedSearches,
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get saved searches' },
      { status: 500 }
    );
  }
}

// Update saved search (update lastSearchedAt and resultCount)
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchId, resultCount } = await request.json();

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    const savedSearch = await SavedSearch.findOneAndUpdate(
      {
        _id: searchId,
        userId: user._id,
      },
      {
        lastSearchedAt: new Date(),
        resultCount: resultCount || 0,
      },
      { new: true }
    );

    if (!savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Saved search updated',
      savedSearch,
    });
  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

// Delete saved search
export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('id');

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    await SavedSearch.findOneAndDelete({
      _id: searchId,
      userId: user._id,
    });

    return NextResponse.json({
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}

