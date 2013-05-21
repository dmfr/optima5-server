Ext.define('Ext.ux.dams.FileDownloader',{
	extend: 'Ext.Component',
	alias: 'widget.filedownloader',
	requires: ['Ext.XTemplate'], 

	renderTpl: [
		'<div id="{id}">',
			  '<iframe css="display:none;visibility:hidden;height:0px;" id="{id}-dliframe" name="{id}-dliframe" frameBorder="0" width="0" height="0">' ,
			  '</iframe>',
			  '<form css="display:none;visibility:hidden;" method="post" id="{id}-dlform" name="{id}-dlform" target="{id}-dliframe">' ,
			  '</form>',
		'</div>'
	],
	hidden: true,
	//renderTo: document.body,
	stateful: false,
	autoRender: true,
	floating: true,
			  
			  
			  
	requestAction: '',
	requestParams: {},
	requestMethod: 'POST',
			  
	initComponent: function(){
		this.addChildEls('dlform','dliframe') ;
		this.callParent() ;
	},
			  
	afterRender:function() {
		var me=this ;
		me.callParent() ;
		
		if( me.requestAction == '' ){
			return ;
		}
		
		//console.log('AfterRender !!') ;
		
		// ******** AfterRender : ajout des éléments au formulaire *********
		switch( me.requestMethod ) {
			case 'GET' :
				this.dlform.dom.method='GET' ;
				break ;
			case 'POST' :
				this.dlform.dom.method='POST' ;
				break ;
		}
		
		this.dlform.dom.action=me.requestAction ;
		
		Ext.Object.each(me.requestParams, function(k,v){
			Ext.DomHelper.append(this.dlform.dom, {
				tag: 'input' ,
				type: 'hidden',
				name: Ext.String.htmlEncode(k),
				value : Ext.String.htmlEncode(v)
			}) ;
		},me);
		
		this.dlform.dom.submit() ;
		// **********************************
		
		//me.destroy() ;
		Ext.Function.defer(me.destroy, 90000, me);
	}
}) ;
