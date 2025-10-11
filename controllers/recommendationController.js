const Shop = require('../models/shop');
const axios = require('axios');

const getAIRecommendations = async (req, res) => {
  try {
    const { query, lat, lng } = req.body;
    console.log('Recommendation request:', { query, lat, lng });

    if (!query || !lat || !lng) {
      return res.status(400).json({ 
        message: 'Query, latitude, and longitude are required' 
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not found in environment');
      return res.status(500).json({ 
        message: 'API configuration error' 
      });
    }

    // First get all nearby shops, then filter by category
    const allNearbyShops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 5000 // 5km radius
        }
      },
      approved: true
    }).limit(20);

    console.log(`Found ${allNearbyShops.length} nearby shops`);
    console.log('Available categories:', allNearbyShops.map(s => s.categories).flat());

    // Filter by category with flexible matching for natural language
    const nearbyShops = allNearbyShops.filter(shop => {
      const queryLower = query.toLowerCase();
      return shop.categories.some(category => {
        const categoryLower = category.toLowerCase();
        return (
          categoryLower.includes(queryLower) ||
          queryLower.includes(categoryLower) ||
          // Food/Restaurant mappings
          (queryLower.match(/\b(food|eat|hungry|meal|dining|restaurant)\b/) && categoryLower.includes('restaurant')) ||
          (queryLower.match(/\b(restaurant|cafe|diner)\b/) && categoryLower.includes('food')) ||
          // Shopping mappings
          (queryLower.match(/\b(shop|shopping|buy|store)\b/) && categoryLower.match(/\b(fashion|electronics|retail)\b/)) ||
          // Service mappings
          (queryLower.match(/\b(haircut|hair|barber)\b/) && categoryLower.includes('beauty')) ||
          (queryLower.match(/\b(fix|repair|service)\b/) && categoryLower.includes('services')) ||
          // Health mappings
          (queryLower.match(/\b(doctor|medical|health|pharmacy)\b/) && categoryLower.includes('health'))
        );
      });
    });

    console.log(`Filtered to ${nearbyShops.length} shops matching "${query}"`);

    if (nearbyShops.length === 0) {
      return res.json({ recommendations: [] });
    }
    
    const shopsToAnalyze = nearbyShops;

    // Send to OpenRouter for AI recommendations
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen3-30b-a3b:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful local discovery assistant that recommends the best nearby shops based on quality, proximity, and popularity.'
          },
          {
            role: 'user',
            content: `
              User query: "${query}"
              User location: lat=${lat}, lng=${lng}

              Available nearby shops:
              ${JSON.stringify(shopsToAnalyze.map(shop => ({
                id: shop._id,
                name: shop.name,
                categories: shop.categories,
                description: shop.description,
                address: shop.address
              })))}

              Based on the user's query, recommend the top 3 most relevant shops. The user might ask in natural language (like "I want food" or "where can I eat"), so interpret their intent.
              
              Respond with ONLY a JSON array in this exact format:
              [
                { "id": "shop_id", "name": "shop name", "category": "shop category", "reason": "why this shop matches the user's needs" }
              ]
            `
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = openRouterResponse.data.choices[0].message.content;
    console.log('AI Response:', aiResponse);
    
    let recommendations;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.log('JSON parse error, using fallback:', parseError.message);
      // Fallback to simple recommendations
      recommendations = shopsToAnalyze.slice(0, 3).map(shop => ({
        id: shop._id,
        name: shop.name,
        category: shop.categories[0] || 'General',
        reason: `Popular local business located nearby`
      }));
    }
    
    // Ensure we have valid recommendations
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      recommendations = shopsToAnalyze.slice(0, 3).map(shop => ({
        id: shop._id,
        name: shop.name,
        category: shop.categories[0] || 'General',
        reason: `Recommended nearby business`
      }));
    }

    // Remove duplicates and limit to 3
    const uniqueRecommendations = recommendations
      .filter((rec, index, arr) => arr.findIndex(r => r.name === rec.name) === index)
      .slice(0, 3);

    res.json({ recommendations: uniqueRecommendations });

  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Return fallback recommendations on error
    try {
      const fallbackShops = await Shop.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 5000
          }
        },
        approved: true
      }).limit(3);
      
      const recommendations = fallbackShops.map(shop => ({
        name: shop.name,
        category: shop.categories[0] || 'General',
        reason: `Popular nearby business`
      }));
      
      res.json({ recommendations });
    } catch (fallbackError) {
      res.status(500).json({ 
        message: 'Failed to get recommendations',
        error: error.message 
      });
    }
  }
};

module.exports = {
  getAIRecommendations
};