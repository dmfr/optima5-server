Ext.define('BibleTreePickerModel', {
    extend: 'Ext.data.Model',
    idProperty: 'nodeKey',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.CrmBase.BibleTreePicker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.op5crmbasebibletreepicker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 
	
	preSubTpl: [
		'<div id="{cmpId}-triggerWrap" data-ref="triggerWrap" class="{triggerWrapCls} {triggerWrapCls}-{ui}">',
			'<div id={cmpId}-inputWrap data-ref="inputWrap" class="{inputWrapCls} {inputWrapCls}-{ui}">'
	],
	
	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : [] ,
	
	bibleId: '' ,
	selectMode: 'multi',
	rootNode: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BibleTreePicker','No module reference ?') ;
		}
		
		this.addEvents('iamready') ;
		this.callParent() ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleTreeOne',
				bible_code : this.bibleId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initSetupTreestore( Ext.decode(response.responseText).dataRoot ) ;
				}
				else {
					this.bibleId = '' ;
				}
			},
			scope: this
		});
		
		
	},
	initSetupTreestore: function( dataRoot ) {
		var me = this ;
		
		this.mystore = Ext.create('Ext.data.TreeStore', {
			model: 'BibleTreePickerModel',
			root: dataRoot 
		});
		if( me.rootNode != null && this.mystore.getNodeById(me.rootNode) != null ) {
			var newRootNode = this.mystore.getNodeById(me.rootNode).copy(undefined,true)  ;
			this.mystore.setRootNode(newRootNode) ;
		}
		
		me.fireEvent('iamready') ;
		me.isReady = true ;
	},
			
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('iamready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		this.callParent() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
	},
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.myValue ;
		me.myValue = record.get('entry_key') ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		me.applyPrettyValue(record) ;
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}
		
		var treepanel = Ext.create('Ext.tree.Panel', {
			store: this.mystore ,
			displayField: 'nodeText',
			rootVisible: true,
			useArrows: true,
			height: 200,
			width: 200,
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me
		}) ;
		
		
		if( me.selectMode == 'multi' ) {
			treepanel.getView().on('checkchange',function(rec,check){
				rec.cascadeBy(function(chrec){
					chrec.set('checked',check) ;
				},this);
				if( !check ) {
					var upRecord = rec ;
					while( upRecord.parentNode ) {
						upRecord.parentNode.set('checked',check) ;
						upRecord = upRecord.parentNode
					}
				}
				me.onCheckChange() ;
			},this) ;
		}
		
		if( me.selectMode == 'single' ) {
			treepanel.getView().on('checkchange',function(rec,check){
				if( !check ) {
					treepanel.getRootNode().cascadeBy(function(chrec){
						chrec.set('checked',false) ;
					},this);
				} else {
					treepanel.getRootNode().cascadeBy(function(chrec){
						if( chrec != rec ) {
							chrec.set('checked',false) ;
						}
					},this);
				}
				me.onCheckChange() ;
			},this) ;
		}
		
		return treepanel ;
	},
	getPicker: function() {
		var me = this,
			treepanel = this.callParent() ;
		
		if( me.selectMode == 'multi' ) {
			treepanel.getRootNode().cascadeBy(function(rec){
				if( Ext.Array.contains( me.myValue , rec.get('nodeKey') ) ) {
					rec.set('checked',true) ;
					rec.cascadeBy(function(childrec){
						childrec.set('checked',true) ;
					},this) ;
					return false ;
				}
				else {
					rec.set('checked',false) ;
				}
			},this) ;
		}
		
		if( me.selectMode == 'single' ) {
			treepanel.getRootNode().cascadeBy(function(rec){
				if( Ext.Array.contains( me.myValue , rec.get('nodeKey') ) ) {
					rec.set('checked',true) ;
				}
				else {
					rec.set('checked',false) ;
				}
			},this) ;
		}
		
		return treepanel ;
	},
	alignPicker: function() {
		var me = this,
				picker;

		if (me.isExpanded) {
				picker = me.getPicker();
				if( me.pickerWidth ) {
					picker.setSize(me.pickerWidth);
				} else if (me.matchFieldWidth) {
					// Auto the height (it will be constrained by min and max width) unless there are no records to display.
					picker.setSize(me.bodyEl.getWidth());
				}
				if (picker.isFloating()) {
					me.doAlign();
				}
		}
	},
	onCheckChange : function() {
		var me = this ;
		
		oldRawValue = me.getRawValue() ;
		
		var checkedKeys = new Array() ;
		if( this.mystore ) {
			this.mystore.getRootNode().cascadeBy(function(rec){
				if( rec.get('checked') == true ) {
					checkedKeys.push( rec.get('nodeKey') ) ;
					return false ;
				}
			},this) ;
		}
		me.myValue = checkedKeys ;
		
		me.setRawValueApplyPretty() ;
		this.fireEvent('change',me,me.getRawValue(),oldRawValue) ;
	},
			  
			  
	setRawValue: function( mvalue ) {
		var me = this ;
		
		if( typeof mvalue === 'undefined' ) {
			return ;
		}
		if( me.getRawValue() == mvalue ) {
			return ;
		}
		
		var myNewValue ;
		switch( me.selectMode ) {
			case 'multi' :
				if( (myNewValue = Ext.JSON.decode(mvalue,true)) == null ) {
					myNewValue = [] ;
					//return ;
				}
				break ;
			case 'single' :
				if( mvalue == null || mvalue == '' ) {
					myNewValue = [] ;
				} else {
					myNewValue = [mvalue] ;
				}
				break ;
		}
		
		
		if( me.rendered ) {
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.removeCls('biblepicker-iconimg-oktree') ;
			me.divtext.dom.innerHTML = '' ;
		}
		
		me.myValue = myNewValue ;
		
		if( !me.isReady ) {
			me.on('iamready',me.setRawValueApplyPretty,me) ;
			return ;
		}
		else {
			me.setRawValueApplyPretty() ;
		}
	},
		
	setRawValueApplyPretty: function() {
		var me = this ;
		
		var mvalue = me.myValue,
			valueNode ;
		
		if( !mvalue || mvalue.length == 0 ) {
			me.divicon.removeCls('biblepicker-iconimg-oktree') ;
			me.divicon.addCls('biblepicker-iconimg-nok') ;
			me.divtext.dom.innerHTML = '' ;
			return ;
		}
		
		if( mvalue.length == 1 ) {
			valueNode = this.mystore.getNodeById(mvalue[0]) ;
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.addCls('biblepicker-iconimg-oktree') ;
			me.divtext.dom.innerHTML = ( !Ext.isEmpty(valueNode) ? valueNode.get('nodeText') : '???' ) ;
			return ;
		}
		
		me.divicon.removeCls('biblepicker-iconimg-nok') ;
		me.divicon.addCls('biblepicker-iconimg-oktree') ;
		me.divtext.dom.innerHTML = mvalue.join(' / ') ;
		return ;
	},
	getRawValue: function() {
		var me = this ;
		
		switch( me.selectMode ) {
			case 'multi' :
				return Ext.JSON.encode(me.myValue) ;
				break ;
			case 'single' :
				return ( ( me.myValue.length == 0 ) ? '' : me.myValue[0] ) ;
				break ;
		}
	},
	getErrors: function( curvalue ) {
		var me = this,
			errors = [] ; 
		if( me.myValue.length < 1 && !me.allowBlank ) {
			errors.push(me.blankText);
		}
		return errors;
	}  
});