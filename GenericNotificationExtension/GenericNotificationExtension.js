(function (Scratch) {
  "use strict";

  class GenericNotificationExtension {
    getInfo() {
      return {
        id: "genericnotificationextension",
        name: "Generic Notification Extension",
        color1: "#FF8C1A",
        color2: "#E67E00",
        color3: "#CC6F00",
        blocks: [
          {
            opcode: "sendNotification",
            blockType: Scratch.BlockType.COMMAND,
            text: "Send Notification with title [TITLE] and description [DESCRIPTION]",
            arguments: {
              TITLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello!"
              },
              DESCRIPTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "This is a notification from Scratch"
              }
            }
          },
          {
            opcode: "browserSupportsNotifications",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "Browser Supports Notifications?"
          }
        ]
      };
    }

    sendNotification(args) {
      const title = String(args.TITLE || "");
      const description = String(args.DESCRIPTION || "");

      if (!("Notification" in window)) {
        console.warn("Generic Notification Extension: This browser does not support notifications.");
        return;
      }

      if (Notification.permission === "granted") {
        new Notification(title, {
          body: description
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, {
              body: description
            });
          }
        });
      } else {
        console.warn("Generic Notification Extension: Notification permission was denied.");
      }
    }

    browserSupportsNotifications() {
      return "Notification" in window;
    }
  }

  Scratch.extensions.register(new GenericNotificationExtension());
})(Scratch);
