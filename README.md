# rule-based-gmail

### How To

1. Add credentials.json to root dir for google auth
```
{
    "installed": {
        "client_id": "",
        "project_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "",
        "redirect_uris": [
            "http://localhost"
        ]
    }
}
```

2. Fetching and storing emails
```
node src/emailDownloader.js
```

3. Performing rule-based actions
```
node src/action.js
```

4. Modifying rules

Add rules.json to root dir for rules with format:
```
{
    "rules": [
        {
            "name": "rule1",
            "predicate": "All", // All, Any
            "conditions": [
                {
                    "field": "from", 
                    "operator": "contains", // contains, does_not_contain, equals, does_not_equal, less_than_days, greater_than_days, less_than_months, greater_than_months
                    "value": "ET Prime: Today's Edition"
                }
            ],
            "actions": [
                {
                    "type": "mark_as_unread" // mark_as_read, mark_as_unread, archive, add_label
                },
                {
                    "type": "archive"
                },
                {
                    "type": "add_label",
                    "value": "test"
                }
            ]
        }
    ]
}
```
