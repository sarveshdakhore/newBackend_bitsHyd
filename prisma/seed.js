import prisma from "../DB/dbConfig.js";
import { genSaltSync, hashSync } from "bcrypt";
import cohere from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

function generateEmbeddings() {
  return Array(1024)
    .fill(0)
    .map(() => Math.random() * 2 - 1);
}

//cohere.init(process.env.COHERE_API_KEY); // Initialize with your API key
// Custom function to generate embeddings using Cohere API via cohere-ai library
async function generateEmbeddingsT(text) {
  try {
    const response = await cohere.embed({
      texts: [text],
      model: "embed-english-light-v2.0", // Change model if needed
      truncate: "NONE",
    });

    // The library returns embeddings in response.body.embeddings as an array; we take the first one.
    let vector = response.body.embeddings[0];

    // Pad or truncate to match the required 1024 dimensions
    if (vector.length < 1024) {
      vector = [...vector, ...Array(1024 - vector.length).fill(0)];
    } else if (vector.length > 1024) {
      vector = vector.slice(0, 1024);
    }

    return vector;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    // Return a zero vector as fallback
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
          password: hashSync("admin123", adminSalt),
          salt: adminSalt,
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
          password: hashSync("user123", userSalt),
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
        label: "Applicant Name",
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
        label: "Applicant Address",
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
        label: "Applicant Nationality",
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
        label: "Applicant Category",
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
        label: "Work Title",
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
        label: "Work Description",
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
        label: "Work Class",
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
        label: "Work Language",
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
        label: "Author Name",
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
        label: "Author Address",
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
        label: "Publication Status",
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
        label: "Publisher Details",
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
        label: "Year of First Publication",
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
        label: "Fee Payment Details",
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
        label: "Declaration",
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
        label: "Work Sample",
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
  const embeddingVector = await generateEmbeddings(
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
  const secondEmbeddingVector = await generateEmbeddings(
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
