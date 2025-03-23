import prisma from "../../DB/dbConfig.js";
import dotenv from "dotenv";

dotenv.config();

export const updateUserAttributes = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const attributeData = req.body;

    // Log the input data
    console.log("Received attributeData:", attributeData);
    console.log("Received userId:", userId);

    // Validate input
    if (!userId) {
      console.log("Validation failed: User ID is required.");
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!attributeData || Object.keys(attributeData).length === 0) {
      console.log("Validation failed: Profile attributes are required.");
      return res.status(400).json({ message: "Profile attributes are required." });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    console.log("Found user:", user);

    // Prepare data for updating user model fields
    const userData = {};
    const results = {};
    let dataUpdated = false;

    for (const [key, value] of Object.entries(attributeData)) {
      if (user.hasOwnProperty(key)) {
        userData[key] = value;
        results[key] = value;
        dataUpdated = true;
      }
    }

    console.log("Prepared userData:", userData);
    console.log("Prepared results:", results);

    // Update the user profile if new attributes were added
    if (dataUpdated) {
      console.log("Updating user profile with data:", userData);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userData,
      });

      console.log("Updated user profile:", updatedUser);

      return res.status(200).json({
        message: "User profile updated with new attributes.",
        updated: true,
        attributes: results,
      });
    }

    console.log("No new attributes were added.");

    // If no updates were needed, just return the existing attributes
    return res.status(200).json({
      message: "Attributes already exist in user profile.",
      updated: false,
      attributes: results,
    });
  } catch (error) {
    console.error("Error updating user attributes:", error);
    return res.status(500).json({
      message: "Failed to update user profile.",
      error: error.message,
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
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Return all profile attributes
        return res.status(200).json({
            message: "User profile attributes retrieved successfully.",
            attributes: user.additional_info || {},
        });
    } catch (error) {
        console.error("Error retrieving user attributes:", error);
        return res.status(500).json({
            message: "Failed to retrieve user profile attributes.",
            error: error.message,
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
            return res
                .status(400)
                .json({ message: "Attributes to remove are required." });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
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
                    id: userId,
                },
                data: {
                    additional_info: additionalInfo,
                },
            });

            return res.status(200).json({
                message: "User profile attributes removed successfully.",
                updated: true,
            });
        }

        return res.status(200).json({
            message: "No attributes were removed from user profile.",
            updated: false,
        });
    } catch (error) {
        console.error("Error removing user attributes:", error);
        return res.status(500).json({
            message: "Failed to remove user profile attributes.",
            error: error.message,
        });
    }
};

// give form data to ML model in json format except embedding everything else to be givin in json format including the fields

// Export form data to ML model (excluding embeddings)
export const getFormDataForML = async (req, res) => {
    try {
        const formId = parseInt(req.params.formId);

        if (!formId) {
            return res.status(400).json({ message: "Form ID is required." });
        }

        // Get form with its fields and their details
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                fields: {
                    orderBy: { order: "asc" },
                    select: {
                        order: true,
                        formField: {
                            select: {
                                id: true,
                                label: true,
                                description: true,
                                fieldType: true,
                                isRequired: true,
                                validations: true,
                            },
                        },
                    },
                },
                //,
                // submissions: {
                //     select: {
                //         id: true,
                //         status: true,
                //         createdAt: true,
                //         updatedAt: true,
                //         userId: true,
                //         user: {
                //             select: {
                //                 name: true,
                //                 email: true
                //             }
                //         },
                //         values: {
                //             select: {
                //                 fieldId: true,
                //                 value: true,
                //                 field: {
                //                     select: {
                //                         label: true
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }
            },
        });

        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }

        // Transform the data for ML model consumption
        const formDataForML = {
            formId: form.id,
            title: form.title,
            description: form.description,
            metadata: {
                createdAt: form.createdAt,
                updatedAt: form.updatedAt,
            },
            fields: form.fields.map((field) => ({
                id: field.formField.id,
                label: field.formField.label,
                description: field.formField.description,
                type: field.formField.fieldType,
                required: field.formField.isRequired,
                validations: field.formField.validations,
                order: field.order,
            })), //,
            // submissions: form.submissions.map(sub => ({
            //     id: sub.id,
            //     status: sub.status,
            //     submittedAt: sub.createdAt,
            //     updatedAt: sub.updatedAt,
            //     user: {
            //         id: sub.userId,
            //         name: sub.user?.name,
            //         email: sub.user?.email
            //     },
            //     values: sub.values.map(val => ({
            //         fieldId: val.fieldId,
            //         fieldLabel: val.field.label,
            //         value: val.value
            //     }))
            // }))
        };

        return res.status(200).json({
            message: "Form data retrieved successfully for ML processing.",
            data: formDataForML,
        });
    } catch (error) {
        console.error("Error retrieving form data for ML:", error);
        return res.status(500).json({
            message: "Failed to retrieve form data for ML processing.",
            error: error.message,
        });
    }
};

// Get ML-ready data for multiple forms with filters
export const getFormsDataForML = async (req, res) => {
    try {
        const { status, limit = 10, offset = 0 } = req.query;

        // Build filter conditions
        const where = {};
        if (status) {
            where.submissions = {
                some: {
                    status: status,
                },
            };
        }

        // Get forms with their fields and submissions
        const forms = await prisma.form.findMany({
            where,
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                fields: {
                    orderBy: { order: "asc" },
                    select: {
                        formField: {
                            select: {
                                id: true,
                                label: true,
                                fieldType: true,
                            },
                        },
                    },
                },
                submissions: {
                    select: {
                        id: true,
                        status: true,
                        values: {
                            select: {
                                fieldId: true,
                                value: true,
                            },
                        },
                    },
                },
            },
        });

        // Transform for ML consumption
        const formsDataForML = forms.map((form) => ({
            formId: form.id,
            title: form.title,
            description: form.description,
            createdAt: form.createdAt,
            fieldCount: form.fields.length,
            submissionCount: form.submissions.length,
            fieldTypes: form.fields.map((f) => ({
                id: f.formField.id,
                label: f.formField.label,
                type: f.formField.fieldType,
            })),
            submissionStatuses: Object.entries(
                form.submissions.reduce((acc, sub) => {
                    acc[sub.status] = (acc[sub.status] || 0) + 1;
                    return acc;
                }, {})
            ).map(([status, count]) => ({ status, count })),
        }));

        return res.status(200).json({
            message: "Forms data retrieved successfully for ML processing.",
            count: forms.length,
            data: formsDataForML,
        });
    } catch (error) {
        console.error("Error retrieving forms data for ML:", error);
        return res.status(500).json({
            message: "Failed to retrieve forms data for ML processing.",
            error: error.message,
        });
    }
};

// Get all submissions for a form
export const getFormSubmissions = async (req, res) => {
    try {
        const formId = parseInt(req.params.formId);

        if (!formId) {
            return res.status(400).json({ message: "Form ID is required." });
        }

        // Check if the forms table exists first
        try {
            // Get form with its submissions
            const form = await prisma.form.findUnique({
                where: { id: formId },
                select: {
                    id: true,
                    title: true,
                    submissions: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true,
                            userId: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                            values: {
                                select: {
                                    fieldId: true,
                                    value: true,
                                    field: {
                                        select: {
                                            label: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!form) {
                return res.status(404).json({ message: "Form not found." });
            }

            // Transform the data for ML model consumption
            const submissionsData = form.submissions.map((sub) => ({
                id: sub.id,
                status: sub.status,
                submittedAt: sub.createdAt,
                updatedAt: sub.updatedAt,
                user: {
                    id: sub.userId,
                    name: sub.user?.name,
                    email: sub.user?.email,
                },
                values: sub.values.map((val) => ({
                    fieldId: val.fieldId,
                    fieldLabel: val.field.label,
                    value: val.value,
                })),
            }));

            return res.status(200).json({
                count: form.submissions.length,
                data: submissionsData,
            });
        } catch (prismaError) {
            // Check if the error is related to missing table
            if (prismaError.code === "P2021") {
                return res.status(500).json({
                    message:
                        "Database setup incomplete. The 'forms' table does not exist.",
                    error: prismaError.message,
                    solution:
                        "Run 'npx prisma db push' or 'npx prisma migrate dev' to create the required database tables.",
                });
            }
            throw prismaError; // Re-throw if it's another type of error
        }
    } catch (error) {
        console.error("Error retrieving form submissions:", error);
        return res.status(500).json({
            message: "Failed to retrieve form submissions.",
            error: error.message,
        });
    }
};

export const getAllFormFields = async (req, res) => {
    try {
        // Retrieve all form fields
        const formFields = await prisma.formField.findMany({
            select: {
                label: true,
                description: true,
            },
        });

        // Transform the data into the desired format
        const formKeys = formFields.map((field) => ({
            label: field.label,
            desc: field.description,
        }));

        return res.status(200).json({
            form_keys: formKeys,
        });
    } catch (error) {
        console.error("Error retrieving form fields:", error);
        return res.status(500).json({
            message: "Failed to retrieve form fields.",
            error: error.message,
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                role: {
                    select: {
                        name: true,
                        description: true,
                    },
                },
                name: true,
                email: true,
                additional_info: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const flatUserData = {
            name: user.name,
            email: user.email,
            ...user.additional_info,
            role: user.role.name,
            ...user.role,

        };

        return res.status(200).json(flatUserData);
    } catch (error) {
        console.error("Error getting user profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getCurrentUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        req.params = { userId: userId };
        return getUserProfile(req, res);
    } catch (error) {
        console.error("Error getting current user profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};