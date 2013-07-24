<?php

class GenericArr {
	private $arr = array() ;
	
	public function add( $v ) {
		$this->arr[] = $v ;
	}
	public function put( $k, $v ) {
		$this->arr[$k] = $v ;
	}
	
	public function getValue( $k ) {
		return $this->arr[$k] ;
	}
	
	public function getArr() {
		return $this->arr ;
	}

}

class GenericTree {

	public $head ;
	
	public $arr_leafs ;
	
	public $parent_GenericTree ;
	
	public $tab_locate ;
	
	public function __construct( $head ) {
		$this->arr_leafs = new GenericArr() ;
		$this->tab_locate = new GenericArr() ;
	
		$this->head = $head ;
		
		$this->depth = 0 ;
		
		$this->tab_locate->put( $head , $this ) ;
	}
	public function addLeaf( $leaf ) {
		$node = new GenericTree( $leaf ) ;
		$this->arr_leafs->add( $node ) ;
		$node->parent_GenericTree = $this ;
		$node->depth = $this->depth + 1 ;
		$node->tab_locate = $this->tab_locate ;
		$this->tab_locate->put( $leaf , $node ) ;
	}
	public function getTree( $elem ) {
		return $this->tab_locate->getValue( $elem ) ;
	}
	public function getLeafs() {
		return $this->arr_leafs->getArr() ;
	}
	public function getParent() {
		return $this->parent_GenericTree ;
	}
	public function getHead() {
		return $this->head ;
	}
	public function getDepth() {
		return $this->depth ;
	}
	
	public function getAllMembers() {
		$arr = array() ;
		$arr[] = $this->head ;
		foreach( $this->arr_leafs->getArr() as $leaf )
		{
			$arr = array_merge($arr,$leaf->getAllMembers()) ;
		}
		return $arr ;
	}
	public function getAllMembersForDepth($depth) {
		$arr = array() ;
		if( $depth == $this->depth )
			$arr[] = $this->head ;
		else
		{
			foreach( $this->arr_leafs->getArr() as $leaf )
			{
				$arr = array_merge($arr,$leaf->getAllMembersForDepth($depth)) ;
			}
		}
		return $arr ;
	}
	
	
	public function printTree($increment=0) {
		$s = "";
		$inc = "";
		for ($i = 0; $i < $increment; $i++) {
			$inc = $inc." ";
		}
		$s.= $inc.$this->getHead();
		foreach($this->getLeafs() as $child) {
			$s.= "\n".$child->printTree($increment + 2);
		}
		return $s;
	}
}

?>
