# Demo

* Create tables with schemas below in WordPress database.
* `php -S localhost:8081 -t .`

# Specifications

## Highlight target

* Highlight every nodes between two selected text nodes.

## WordPress modification requirements

### Post

* Every text node in a post must has an ID.
    * Text nodes are replaced by `span` tag with an ID.

### Saving post hook

* When saving a post, the plugin scans for changes before and after editing and 
remove all highlights corresspond to the deleted text nodes.

## Database schemas

```sql
CREATE TABLE `wp_highlights` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `postId` bigint(20) unsigned NOT NULL,
  `anchorNodeId` char(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `focusNodeId` char(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anchorOffset` int(11) NOT NULL,
  `focusOffset` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_wp_highlights` (`postId`,`anchorNodeId`,`focusNodeId`,`anchorOffset`,`focusOffset`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wp_user_highlights` (
  `highlightId` bigint(20) unsigned NOT NULL,
  `userId` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`highlightId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```
