<?php
header('Content-Type: application/json');

$result = array();
    
if ($_SERVER['REQUEST_METHOD'] == 'POST' 
    && !is_null($_POST['postId'])
    && !is_null($_POST['userId'])) 
{
    $postId = $_POST['postId'];
    $userId = $_POST['userId'];

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
        $stm = $dbh->prepare(
            'SELECT anchorNodeId, focusNodeId, anchorOffset, focusOffset 
            FROM wp_user_highlights
            JOIN wp_highlights
            ON highlightId = id
            WHERE userId = :userId
            AND postId = :postId'
        );
        $stm->bindParam(':userId', $userId);
        $stm->bindParam(':postId', $postId);
        $stm->execute();

        while ($row = $stm->fetch(PDO::FETCH_ASSOC)) {
            array_push($result, $row);            
        }
    }
}

echo json_encode($result);
?>
