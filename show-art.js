const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
async function imageMessage(html, mode) {
    const url = html.find("[name=url]")[0].value;
    if (url === "") {
        return;
    }
    if (mode == "chat") {
        const messageContent = `<img src="${url}" />`;
        const checked = html.find("[name=whisper]")[0].checked;
        if(!checked) {
            await ChatMessage.create({content: messageContent});
            return;
        }
        const playerId = html.find("[name=player]")[0].value;
        const playerName = game.users.get(playerId).data.name;
        await ChatMessage.create({content: messageContent, whisper: ChatMessage.getWhisperRecipients(playerName)})
    }
    if (mode == "popout"){
        const popout = new ImagePopout(url).render(true);
        popout.shareImage();
    }

}
(async () => {
    let dialogOptions = game.users.filter(u => u.data.role < 3).map(u => `<option value=${u.id}> ${u.data.name} </option>`).join(``);
    
    
    /*
    let dialogContent = `
                        <div><h2>Image URL:</h2><div>
                        <div>URL: <input name="url" style="width:350px"/></div>
                        <div>Whisper to player?<input name="whisper" type="checkbox"/></div>
                        <div">Player name:<select name="player" disabled>${dialogOptions}</select></div>
                        `;
    */
    let dialogContent = `
                        <div>Image URL: <input name="url" style="width:100%; margin-bottom: 1rem;"/></div>
                        `;
    let d = new Dialog({
        title: "Share Image",
        content: dialogContent,
        buttons: {
/*
            done: {
                label: "Send to Chat!",
                callback: (html) => {
                    imageMessage(html, "chat");
                }
            },
*/
            show: {
                label: "Show image!",
                callback: (html) => {
                    imageMessage(html, "popout");
                }
            }
        },
        default: "done"    
    })
    d.render(true)
    await wait(50)
    $(document).ready(function() {
        $("[name=whisper]").change(function () {
            if($("[name=player]").attr("disabled")){
                $("[name=player]").removeAttr("disabled")
            }
            else {
               $("[name=player]").attr("disabled", true)  
            }
        });
    });
})();