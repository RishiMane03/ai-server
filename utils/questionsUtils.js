async function questions(paragraph) {
    let url = "https://api.openai.com/v1/chat/completions";
    let token = `Bearer ${process.env.OPENAI_API_KEY}`;
    let model = 'gpt-3.5-turbo';

    let messagesToSend = [
        {
            role: 'user',
            content: `just give the list of 5 easy level questions,5 medium level questions,5 hard level questions from this paragraph ${paragraph} and divide them into easy medium and hard`
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

module.exports = questions;
