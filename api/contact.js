export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    // Request Body sicher auslesen
    let body = req.body;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    body = body || {};

    const {
      firstName,
      lastName,
      company,
      email,
      phone,
      consumption,
      service,
      message,
      website
    } = body;

    // Spam-Schutz
    if (website) {
      return res.status(200).json({
        success: true
      });
    }

    // Pflichtfelder prüfen
    if (!firstName || !lastName || !email || !company) {
      return res.status(400).json({
        success: false,
        message: "Bitte füllen Sie alle Pflichtfelder aus."
      });
    }

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL,
          to: [process.env.CONTACT_EMAIL],
          reply_to: email,
          subject: `Neue Anfrage von ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Neue Anfrage über die AND Agency Website</h2>

              <p><strong>Vorname:</strong> ${firstName}</p>
              <p><strong>Nachname:</strong> ${lastName}</p>
              <p><strong>Unternehmen:</strong> ${company}</p>
              <p><strong>E-Mail:</strong> ${email}</p>
              <p><strong>Telefon:</strong> ${phone || "-"}</p>
              <p><strong>Jahresverbrauch:</strong> ${consumption || "-"}</p>
              <p><strong>Interesse:</strong> ${service || "-"}</p>

              <hr>

              <h3>Nachricht</h3>
              <p>${message || "-"}</p>
            </div>
          `
        })
      }
    );

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", data);

      return res.status(500).json({
        success: false,
        message: "Die E-Mail konnte nicht versendet werden."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vielen Dank. Ihre Anfrage wurde erfolgreich gesendet."
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "Es ist ein Fehler aufgetreten."
    });
  }
}
