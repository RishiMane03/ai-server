async function pdfDoubt(para,doubt) {
    let url = "https://api.openai.com/v1/chat/completions";
    let token = `Bearer ${process.env.OPENAI_API_KEY}`;
    let model = 'gpt-3.5-turbo';

    let messagesToSend = [
        {
            role: 'user',
            content: `${para} i have doubt in this paragraph ${doubt} tell me in short`
        }
    ];

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: messagesToSend
        })
    });

    let resjson = await response.json();

    if (resjson) {
        return resjson.choices[0].message;
    }
}

module.exports = pdfDoubt;
