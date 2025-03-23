import prisma from '../../DB/dbConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Update or retrieve user attributes from ML analysis
export const updateUserAttributes = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const attributeData = req.body;
        
        // Validate input
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        
        if (!attributeData || Object.keys(attributeData).length === 0) {
            return res.status(400).json({ message: "Profile attributes are required." });
        }
        
        // Find the user
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Get current additional info
        let additionalInfo = user.additional_info || {};
        const results = {};
        let dataUpdated = false;
        
        // Check each attribute in the request
        for (const [key, value] of Object.entries(attributeData)) {
            // If attribute exists, return its current value
            if (additionalInfo[key]) {
                results[key] = additionalInfo[key];
            } else {
                // Otherwise, add it to user profile
                additionalInfo[key] = value;
                results[key] = value;
                dataUpdated = true;
            }
        }
        
        // Update the user profile if new attributes were added
        if (dataUpdated) {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    additional_info: additionalInfo
                }
            });
            
            return res.status(200).json({ 
                message: "User profile updated with new attributes.", 
                updated: true,
                attributes: results 
            });
        }
        
        // If no updates were needed, just return the existing attributes
        return res.status(200).json({ 
            message: "Attributes already exist in user profile.", 
            updated: false,
            attributes: results 
        });
        
    } catch (error) {
        console.error("Error updating user attributes:", error);
        return res.status(500).json({ 
            message: "Failed to update user profile.", 
            error: error.message 
        });
    }
};

// Get all user attributes
export const getUserAttributes = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Return all profile attributes
        return res.status(200).json({ 
            message: "User profile attributes retrieved successfully.",
            attributes: user.additional_info || {}
        });
        
    } catch (error) {
        console.error("Error retrieving user attributes:", error);
        return res.status(500).json({ 
            message: "Failed to retrieve user profile attributes.", 
            error: error.message 
        });
    }
};

// Remove specific attributes from user profile
export const removeUserAttributes = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { attributes } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        
        if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
            return res.status(400).json({ message: "Attributes to remove are required." });
        }
        
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Get current additional info
        let additionalInfo = user.additional_info || {};
        let attributesRemoved = false;
        
        // Remove specified attributes
        for (const attribute of attributes) {
            if (additionalInfo[attribute]) {
                delete additionalInfo[attribute];
                attributesRemoved = true;
            }
        }
        
        // Update the user if attributes were removed
        if (attributesRemoved) {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    additional_info: additionalInfo
                }
            });
            
            return res.status(200).json({ 
                message: "User profile attributes removed successfully.", 
                updated: true
            });
        }
        
        return res.status(200).json({ 
            message: "No attributes were removed from user profile.", 
            updated: false
        });
        
    } catch (error) {
        console.error("Error removing user attributes:", error);
        return res.status(500).json({ 
            message: "Failed to remove user profile attributes.", 
            error: error.message 
        });
    }
};