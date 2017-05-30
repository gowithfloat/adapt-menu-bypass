define(["coreJS/adapt", "coreJS/router"], function(Adapt, Router) {
    Adapt.on("router:navigate", function onNavigate(args) {
        if (!args || !args.length) {
            return;
        }

        var originalTarget = Adapt.findById(args[0]);

        if (!originalTarget || originalTarget.get("_type") !== "menu") {
            return;
        }

        var bypassConfig = originalTarget.get("_menuBypass");
        if (!bypassConfig || !bypassConfig._isEnabled) {
            return;
        }

        // Cancels the current navigation attempt
        Adapt.router.set("_canNavigate", false, {pluginName:"menuBypass"});

        // Before we can trigger the next page, the plugin needs to wait until
        // Adapt has _finished_ cancelling navigation to the menu.
        // Note: Adapt's router:navigationCancelled event happens _too early_ to use here
        Router.once("route", function onNavigationCancelled() {
            Adapt.router.set("_canNavigate", true, {pluginName:"menuBypass"});

            var newTarget;

            // Determine if the bypassed menu was being navigated to from a parent or a child
            var currentPageParent = _getCurrentPageParent();
            if (currentPageParent && currentPageParent.get("_id") === originalTarget.get("_id")) {
                // If the user intended to go to the current page's parent,
                // but the current page's parent is the bypassed menu,
                // go to the bypassed menu's parent instead
                newTarget = originalTarget.getParent();
            } else if (originalTarget.getChildren() && originalTarget.getChildren().length) {
                // Otherwise, if the user intended to go to the bypassed menu,
                // go to the menu's first child
                newTarget = originalTarget.getChildren().at(0);
            } else {
                // No where to go...
                return;
            }

            if (!newTarget) {
                return;
            }

            Backbone.history.navigate('#/id/' + newTarget.get("_id"), {trigger: true});
        });
    });

    function _getCurrentPageParent() {
        if (!Adapt.location._currentId) {
            return null;
        }
        var currentPage = Adapt.findById(Adapt.location._currentId);

        if (!currentPage) {
            return null;
        }

        return currentPage.getParent();
    }
});
