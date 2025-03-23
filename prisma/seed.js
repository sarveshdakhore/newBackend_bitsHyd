import prisma from "../DB/dbConfig.js";
import { genSaltSync, hashSync } from "bcrypt";
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";
import { hashPassword } from "../utils/hashing.js";

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function generateEmbeddingsT(text) {
  try {
    const response = await cohere.embed({
      texts: [text],
      model: "embed-english-v3.0",
      inputType: "search_document", // Valid input_type
      embeddingTypes: ["float"], // Required parameter
      truncate: "END",
    });

    let vector = response.embeddings.float[0];

    // Pad or truncate to match the required 1024 dimensions
    if (vector.length < 1024) {
      vector = [...vector, ...Array(1024 - vector.length).fill(0)];
    } else if (vector.length > 1024) {
      vector = vector.slice(0, 1024);
    }

    return vector;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return Array(1024).fill(0);
  }
}

async function main() {
  console.log("Starting seed process...");

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Administrator with full access",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "User",
      description: "Regular user with limited access",
    },
  });

  console.log("Created roles");

  // Create admin user with password
  const adminSalt = genSaltSync(10);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      verified: true,
      token_v: 1,
      roleId: adminRole.id,
      additional_info: { department: "Legal", position: "Administrator" },
      password: {
        create: {
          password: hashPassword("admin123", adminSalt).hash,
          salt: adminSalt,
        },
      },
    },
  });

  // Create Sarvesh
  const sarveshSalt = genSaltSync(10);
  const sarveshUser = await prisma.user.create({
    data: {
      email: "sarvesh.dakhore2023@vitstudent.ac.in",
      name: "Sarvesh Dakhore",
      verified: true,
      token_v: 1,
      roleId: userRole.id,
      additional_info: { department: "Tech", position: "Test" },
      password: {
        create: {
          password: hashPassword("12345678", sarveshSalt).hash,
          salt: sarveshSalt,
        },
      },
    },
  });

  // Create regular user with password
  const userSalt = genSaltSync(10);
  const regularUser = await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "Regular User",
      verified: true,
      token_v: 1,
      roleId: userRole.id,
      additional_info: { department: "Copyright", position: "Applicant" },
      password: {
        create: {
          password: hashPassword("user123", userSalt).hash,
          salt: userSalt,
        },
      },
    },
  });

  console.log("Created users");

  // Create OTP for regular user (as an example)
  const otpSalt = genSaltSync(10);
  await prisma.otp.create({
    data: {
      userId: regularUser.id,
      otp: hashSync("123456", otpSalt),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      type: "login",
      salt: otpSalt,
    },
  });

  console.log("Created OTP");

  // Create form fields for copyright registration form
  const formFields = [];

  // Applicant information fields
  formFields.push(
    await prisma.formField.create({
      data: {
        label: "applicant_name", // Changed from "Applicant Name"
        description: "Full name of the applicant",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 3, maxLength: 200 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "applicant_address", // Changed from "Applicant Address"
        description: "Complete address of the applicant",
        fieldType: "TEXTAREA",
        isRequired: true,
        validations: { minLength: 10, maxLength: 500 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "applicant_nationality", // Changed from "Applicant Nationality"
        description: "Nationality of the applicant",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 2, maxLength: 100 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "applicant_category", // Changed from "Applicant Category"
        description: "Category of the applicant",
        fieldType: "SELECT",
        isRequired: true,
        validations: { options: ["Individual", "Business", "Others"] },
      },
    })
  );

  // Work details fields
  formFields.push(
    await prisma.formField.create({
      data: {
        label: "work_title", // Changed from "Work Title"
        description: "Title of the work for copyright registration",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 1, maxLength: 200 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "work_description", // Changed from "Work Description"
        description: "Description of the work",
        fieldType: "TEXTAREA",
        isRequired: true,
        validations: { minLength: 10, maxLength: 500 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "work_class", // Changed from "Work Class"
        description: "Class of the work",
        fieldType: "SELECT",
        isRequired: true,
        validations: {
          options: [
            "Literary",
            "Dramatic",
            "Musical",
            "Artistic",
            "Cinematograph Film",
            "Sound Recording",
            "Computer Software",
          ],
        },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "work_language", // Changed from "Work Language"
        description: "Language of the work",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 2, maxLength: 50 },
      },
    })
  );

  // Author information
  formFields.push(
    await prisma.formField.create({
      data: {
        label: "author_name", // Changed from "Author Name"
        description: "Full name of the author",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 3, maxLength: 200 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "author_address", // Changed from "Author Address"
        description: "Address of the author",
        fieldType: "TEXTAREA",
        isRequired: true,
        validations: { minLength: 10, maxLength: 500 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "publication_status", // Changed from "Publication Status"
        description: "Is the work published or unpublished?",
        fieldType: "SELECT",
        isRequired: true,
        validations: { options: ["Published", "Unpublished"] },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "publisher_details", // Changed from "Publisher Details"
        description: "Name and address of the publisher",
        fieldType: "TEXTAREA",
        isRequired: false,
        validations: { minLength: 0, maxLength: 300 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "publication_year", // Changed from "Year of First Publication"
        description: "Year when the work was first published",
        fieldType: "NUMBER",
        isRequired: false,
        validations: { min: 1800, max: 2025 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "fee_payment_details", // Changed from "Fee Payment Details"
        description: "Details of payment of registration fee",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 5, maxLength: 100 },
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "declaration", // Changed from "Declaration"
        description:
          "I verify that particulars given in this form are true to the best of my knowledge",
        fieldType: "CHECKBOX",
        isRequired: true,
        validations: {},
      },
    })
  );

  formFields.push(
    await prisma.formField.create({
      data: {
        label: "work_sample", // Changed from "Work Sample"
        description:
          "Upload a copy of the work for which registration is sought",
        fieldType: "FILE",
        isRequired: true,
        validations: { fileTypes: ["pdf", "docx", "jpg", "png"], maxSize: 10 },
      },
    })
  );

  console.log(`Created ${formFields.length} form fields`);

  // Create Form for Copyright Registration
  const formTitle =
    "FORM XIV - APPLICATION FOR REGISTRATION OF COPYRIGHT [SEE RULE 70]";
  const formDescription = `
    FORM XIV - APPLICATION FOR REGISTRATION OF COPYRIGHT
    For applying to the Registrar of Copyrights, Copyright Office, New Delhi
    for registration of copyright in accordance with section 45 of the Copyright Act, 1957 (14 of 1957).
  `;

  // Generate embeddings for the form
  const embeddingVector = await generateEmbeddingsT(
    `${formTitle} ${formDescription}`
  );

  // Using raw SQL to insert the form with vector
  await prisma.$executeRaw`
    INSERT INTO forms (title, description, embeddings, "createdAt", "updatedAt")
    VALUES (${formTitle}, ${formDescription}, ${embeddingVector}::vector(1024), NOW(), NOW())
  `;

  // Get the created form
  const form = await prisma.form.findFirst({
    where: { title: formTitle },
  });

  console.log("Created form with embeddings");

  // Associate fields with form
  for (let i = 0; i < formFields.length; i++) {
    await prisma.formFieldOnForm.create({
      data: {
        formId: form.id,
        fieldId: formFields[i].id,
        order: i + 1,
      },
    });
  }

  console.log("Associated fields with form");

  // Create a draft submission for regular user
  const draftSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: regularUser.id,
      status: "DRAFT",
    },
  });

  // Add some sample values for the draft submission
  await prisma.formValue.create({
    data: {
      submissionId: draftSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: draftSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "Digital Innovation Framework",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: draftSubmission.id,
      fieldId: formFields[6].id, // Work Class
      value: "Literary",
    },
  });

  // Create a completed submission for admin user
  const submittedSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: adminUser.id,
      status: "SUBMITTED",
    },
  });

  // Add complete values for the submitted submission
  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "Tech Innovations Pvt Ltd",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[1].id, // Applicant Address
      value: "123 Innovation Park, Bengaluru, Karnataka, India",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[2].id, // Applicant Nationality
      value: "Indian",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "AI-Powered Data Analytics Platform",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[5].id, // Work Description
      value:
        "A comprehensive software solution for data analytics using AI and ML algorithms",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: submittedSubmission.id,
      fieldId: formFields[6].id, // Work Class
      value: "Computer Software",
    },
  });

  console.log("Created form submissions with values");

  // Add more submissions with different statuses

  // Create an APPROVED submission for regular user
  const approvedSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: regularUser.id,
      status: "APPROVED",
    },
  });

  // Add values for the approved submission
  await prisma.formValue.create({
    data: {
      submissionId: approvedSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: approvedSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "Novel Writing Framework",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: approvedSubmission.id,
      fieldId: formFields[6].id, // Work Class
      value: "Literary",
    },
  });

  // Create a REJECTED submission for regular user
  const rejectedSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: regularUser.id,
      status: "REJECTED",
    },
  });

  // Add values for the rejected submission
  await prisma.formValue.create({
    data: {
      submissionId: rejectedSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: rejectedSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "Music Composition Tool",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: rejectedSubmission.id,
      fieldId: formFields[6].id, // Work Class
      value: "Musical",
    },
  });

  // Create an APPROVED submission for admin user
  const adminApprovedSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: adminUser.id,
      status: "APPROVED",
    },
  });

  // Add values for admin's approved submission
  await prisma.formValue.create({
    data: {
      submissionId: adminApprovedSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "Tech Innovations Inc.",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: adminApprovedSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "Blockchain Security Protocol",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: adminApprovedSubmission.id,
      fieldId: formFields[6].id, // Work Class
      value: "Computer Software",
    },
  });

  // Create a DRAFT submission for admin user (another one)
  const adminDraftSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      userId: adminUser.id,
      status: "DRAFT",
    },
  });

  // Add values for admin's draft submission
  await prisma.formValue.create({
    data: {
      submissionId: adminDraftSubmission.id,
      fieldId: formFields[0].id, // Applicant Name
      value: "Admin Organization",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: adminDraftSubmission.id,
      fieldId: formFields[4].id, // Work Title
      value: "Data Privacy Framework",
    },
  });

  // Create a second form for testing multiple forms in metrics

  const secondFormTitle = "Leave Application Form";
  const secondFormDescription =
    "Form for applying for leave from work or school";

  // Generate embeddings for the second form
  const secondEmbeddingVector = await generateEmbeddingsT(
    `${secondFormTitle} ${secondFormDescription}`
  );

  // Using raw SQL to insert the second form with vector
  await prisma.$executeRaw`
    INSERT INTO forms (title, description, embeddings, "createdAt", "updatedAt")
    VALUES (${secondFormTitle}, ${secondFormDescription}, ${secondEmbeddingVector}::vector(1024), NOW(), NOW())
  `;

  // Get the created second form
  const secondForm = await prisma.form.findFirst({
    where: { title: secondFormTitle },
  });

  console.log("Created second form with embeddings");

  // Create form fields for leave application form
  const leaveFormFields = [];

  // Applicant information fields (similar to copyright form)
  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_applicant_name", // Changed from "Leave Applicant Name"
        description: "Full name of the leave applicant",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 3, maxLength: 200 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "employee_id", // Changed from "Employee ID"
        description: "Identification number of the employee",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 2, maxLength: 50 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "employee_department", // Changed from "Employee Department"
        description: "Department of the applicant",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 2, maxLength: 100 },
      },
    })
  );

  // Leave details fields
  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_type", // Changed from "Leave Type"
        description: "Type of leave requested",
        fieldType: "SELECT",
        isRequired: true,
        validations: {
          options: [
            "Sick Leave",
            "Casual Leave",
            "Vacation",
            "Personal Leave",
            "Study Leave",
            "Copyright Research Leave",
          ],
        },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_start_date", // Changed from "Leave Start Date"
        description: "First day of requested leave",
        fieldType: "DATE",
        isRequired: true,
        validations: {},
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_end_date", // Changed from "Leave End Date"
        description: "Last day of requested leave",
        fieldType: "DATE",
        isRequired: true,
        validations: {},
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_reason", // Changed from "Leave Reason"
        description: "Detailed reason for requesting leave",
        fieldType: "TEXTAREA",
        isRequired: true,
        validations: { minLength: 10, maxLength: 500 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "ip_work_related", // Changed from "IP Work Related"
        description:
          "Is this leave related to work on intellectual property or copyright applications?",
        fieldType: "SELECT",
        isRequired: true,
        validations: { options: ["Yes", "No"] },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "work_handover_info", // Changed from "Work Handover Info"
        description: "Details of pending work and handover arrangements",
        fieldType: "TEXTAREA",
        isRequired: false,
        validations: { minLength: 0, maxLength: 500 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_contact_info", // Changed from "Leave Contact Info"
        description: "Contact information during leave period",
        fieldType: "TEXT",
        isRequired: true,
        validations: { minLength: 5, maxLength: 100 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_supporting_docs", // Changed from "Leave Supporting Docs"
        description: "Upload any relevant supporting documents",
        fieldType: "FILE",
        isRequired: false,
        validations: { fileTypes: ["pdf", "jpg", "png"], maxSize: 5 },
      },
    })
  );

  leaveFormFields.push(
    await prisma.formField.create({
      data: {
        label: "leave_declaration", // Changed from "Leave Declaration"
        description:
          "I verify that the information provided is true and accurate",
        fieldType: "CHECKBOX",
        isRequired: true,
        validations: {},
      },
    })
  );

  console.log(
    `Created ${leaveFormFields.length} form fields for leave application`
  );

  // Associate fields with the second form
  for (let i = 0; i < leaveFormFields.length; i++) {
    await prisma.formFieldOnForm.create({
      data: {
        formId: secondForm.id,
        fieldId: leaveFormFields[i].id,
        order: i + 1,
      },
    });
  }

  console.log("Associated fields with leave application form");

  // Create submissions for the second form
  const leaveFormDraft = await prisma.formSubmission.create({
    data: {
      formId: secondForm.id,
      userId: regularUser.id,
      status: "DRAFT",
    },
  });

  const leaveFormApproved = await prisma.formSubmission.create({
    data: {
      formId: secondForm.id,
      userId: regularUser.id,
      status: "APPROVED",
    },
  });

  const leaveFormRejected = await prisma.formSubmission.create({
    data: {
      formId: secondForm.id,
      userId: regularUser.id,
      status: "REJECTED",
    },
  });

  // Add a few more for the admin user
  const adminLeaveFormApproved = await prisma.formSubmission.create({
    data: {
      formId: secondForm.id,
      userId: adminUser.id,
      status: "APPROVED",
    },
  });

  // Add values for leave form submissions
  await prisma.formValue.create({
    data: {
      submissionId: leaveFormDraft.id,
      fieldId: leaveFormFields[0].id, // Now "Leave Applicant Name"
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormDraft.id,
      fieldId: leaveFormFields[3].id, // Leave Type
      value: "Copyright Research Leave",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormApproved.id,
      fieldId: leaveFormFields[0].id, // Now "Leave Applicant Name"
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormApproved.id,
      fieldId: leaveFormFields[3].id, // Leave Type
      value: "Vacation",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormApproved.id,
      fieldId: leaveFormFields[7].id, // Now "IP Work Related"
      value: "Yes",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormRejected.id,
      fieldId: leaveFormFields[0].id, // Now "Leave Applicant Name"
      value: "John Smith",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: leaveFormRejected.id,
      fieldId: leaveFormFields[3].id, // Leave Type
      value: "Study Leave",
    },
  });

  await prisma.formValue.create({
    data: {
      submissionId: adminLeaveFormApproved.id,
      fieldId: leaveFormFields[0].id, // Now "Leave Applicant Name"
      value: "Admin User",
    },
  });

  console.log("Added additional form submissions with different statuses");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
