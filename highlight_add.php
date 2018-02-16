<?php
    function createHighlight($dbh, $highlight) {
        $stm = $dbh->prepare(
            'INSERT INTO wp_highlights (
                postId, 
                anchorNodeId, 
                focusNodeId, 
                anchorOffset, 
                focusOffset
            ) VALUES (
                :postId,
                :anchorNodeId,
                :focusNodeId,
                :anchorOffset,
                :focusOffset
            )'
        );

        $stm->bindParam(':postId', $highlight['postId']);
        $stm->bindParam(':anchorNodeId', $highlight['anchorNodeId']);
        $stm->bindParam(':focusNodeId', $highlight['focusNodeId']);
        $stm->bindParam(':anchorOffset', $highlight['anchorOffset']);
        $stm->bindParam(':focusOffset', $highlight['focusOffset']);
        $stm->execute();

        if ($stm->errorCode() != '00000') {
            throw new Exception($stm->errorInfo[2]);
        }

        if ($stm->rowCount() == 1) {
            return $dbh->lastInsertId();
        } else {
            return null;
        }
    }

    function getHighlightId($dbh, $highlight) {
        $stm = $dbh->prepare(
            'SELECT id FROM wp_highlights WHERE
                postId == :postId
                AND anchorNodeId = :anchorNodeId
                AND focusNodeId = :focusNodeId
                AND anchorOffset = :anchorOffset
                AND focusOffset = :focusOffset'
        );

        $stm->bindParam(':postId', $highlight['postId']);
        $stm->bindParam(':anchorNodeId', $highlight['anchorNodeId']);
        $stm->bindParam(':focusNodeId', $highlight['focusNodeId']);
        $stm->bindParam(':anchorOffset', $highlight['anchorOffset']);
        $stm->bindParam(':focusOffset', $highlight['focusOffset']);
        $stm->execute();

        if ($stm->errorCode() != '00000') {
            throw new Exception($stm->errorInfo[2]);
        }

        $row = $stm->fetch(FDO::FETCH_ASSOC);
        return $row['id'];
    }

    function createUserHighlight($dbh, $highlightId, $userId) {
        $stm = $dbh->prepare(
            'INSERT INTO wp_user_highlights (
                highlightId,
                userId
            ) VALUES (
                :highlightId,
                :userId
            )'
        );
        $stm->bindParam(':highlightId', $highlightId);
        $stm->bindParam(':userId', $userId);
        $stm->execute();

        if ($stm->errorCode() != '00000') {
            throw new Exception($stm->errorInfo[2]);
        }

        return $stm->rowCount() == 1;
    }

    header('Content-Type: application/json');

    $result = array(
        'status' => 'unchanged'
    );

    if ($_SERVER['REQUEST_METHOD'] == 'POST'
        && !is_null($_POST['postId'])
        && !is_null($_POST['authorId'])
        && !is_null($_POST['anchorNodeId'])
        && !is_null($_POST['focusNodeId'])
        && !is_null($_POST['anchorOffset']) 
        && !is_null($_POST['focusOffset'])
    ) {
        $highlight = array(
            'postId' => $_POST['postId'],
            'anchorNodeId' => $_POST['anchorNodeId'],
            'focusNodeId' => $_POST['focusNodeId'],
            'anchorOffset' => $_POST['anchorOffset'],
            'focusOffset' => $_POST['focusOffset']
        );
        $userId = $_POST['authorId'];

        $dbh = null;
        try {
            $dbh = new PDO(
                'mysql:host=localhost;dbname=wordpress', 
                'root', 
                'o0o.lucyxyuno.o0o'
            );
        } catch (PDOException $e) {
            error_log($e->getMessage());
        }

        if (!is_null($dbh)) {
            $dbh->beginTransaction();

            try {
                $highlightId = createHighlight($dbh, $highlight); 
                
                if (is_null($highlightId)) {
                    $highlightId = getHighlightId($dbh, $highlight);
                }            

                $changed = createUserHighlight($dbh, $highlightId, $userId);
                if ($changed) {
                    $result['status'] = 'changed';
                    $result = array_merge($result, $highlight);
                    $dbh->commit();
                }
            } catch (Exception $e) {
                error_log('Unable to create highlight! Rolling back ...');
                error_log($e->getMessage());
                $dbh->rollback();
            }
        }
    } 

    echo json_encode($result);
?>
