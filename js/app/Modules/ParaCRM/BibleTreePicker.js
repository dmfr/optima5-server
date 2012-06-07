Ext.define('BibleTreePickerModel', {
    extend: 'Ext.data.Model',
    idProperty: 'nodeKey',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.ParaCRM.BibleTreePicker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.op5paracrmbibletreepicker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 

	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
			'{triggerEl}',
			'<div class="{clearCls}" role="presentation"></div>',
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
	
	initComponent: function() {
		var me = this ;
		this.addEvents('iamready') ;
		this.addChildEls('divicon','divtext') ;
		this.callParent() ;
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				_moduleName: 'paracrm',
				_action : 'data_getBibleTreeOne',
				bible_code : this.bibleId
			},
			succCallback: function(response) {
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
			nodeParam: 'nodeKey',
			root: dataRoot 
		});
		
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
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
		}) ;
		
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
		
		return treepanel ;
	},
	alignPicker: function() {
		var me = this,
				picker;

		if (me.isExpanded) {
				picker = me.getPicker();
				if (me.matchFieldWidth) {
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
		if( (myNewValue = Ext.JSON.decode(mvalue,true)) == null ) {
			myNewValue = [] ;
			//return ;
		}
		
		
		if( me.rendered ) {
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.removeCls('biblepicker-iconimg-ok') ;
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
		
		var mvalue = me.myValue ;
		
		if( !mvalue || mvalue.length == 0 ) {
			me.divicon.removeCls('biblepicker-iconimg-ok') ;
			me.divicon.addCls('biblepicker-iconimg-nok') ;
			me.divtext.dom.innerHTML = '' ;
			return ;
		}
		
		if( mvalue.length == 1 ) {
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.addCls('biblepicker-iconimg-ok') ;
			me.divtext.dom.innerHTML = this.mystore.getNodeById(mvalue[0]).get('nodeText') ;
			return ;
		}
		
		me.divicon.removeCls('biblepicker-iconimg-nok') ;
		me.divicon.addCls('biblepicker-iconimg-ok') ;
		me.divtext.dom.innerHTML = mvalue.join(' / ') ;
		return ;
	},
	getRawValue: function() {
		var me = this ;
		return Ext.JSON.encode(me.myValue) ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	}  
});